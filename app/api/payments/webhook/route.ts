import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creditSellerWalletsForOrder } from "@/lib/seller-wallet";

function normalizeStatus(value: unknown) {
  const status = String(value || "").toUpperCase();
  if (["SUCCESSFUL", "SUCCESS", "COMPLETED"].includes(status)) return "SUCCESSFUL" as const;
  if (["FAILED", "CANCELLED", "REJECTED"].includes(status)) return "FAILED" as const;
  return "PENDING" as const;
}

async function getConfig() {
  const apiUser = process.env.MTN_MOMO_API_USER;
  const apiKey = process.env.MTN_MOMO_API_KEY;
  const subscriptionKey = process.env.MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY;
  const baseUrl = (process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com").replace(//$/, "");
  const targetEnvironment = process.env.MTN_MOMO_TARGET_ENVIRONMENT || "sandbox";
  if (!apiUser || !apiKey || !subscriptionKey) throw new Error("MTN_MOMO_NOT_CONFIGURED");
  return { apiUser, apiKey, subscriptionKey, baseUrl, targetEnvironment };
}

async function getAccessToken(config: Awaited<ReturnType<typeof getConfig>>) {
  const basic = Buffer.from(config.apiUser + ":" + config.apiKey).toString("base64");
  const response = await fetch(config.baseUrl + "/collection/token/", {
    method: "POST",
    headers: {
      Authorization: "Basic " + basic,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) throw new Error("Could not get MTN MoMo access token.");
  return String(data.access_token);
}

async function getPaymentStatus(referenceId: string) {
  const config = await getConfig();
  const token = await getAccessToken(config);
  const response = await fetch(config.baseUrl + "/collection/v1_0/requesttopay/" + encodeURIComponent(referenceId), {
    headers: {
      Authorization: "Bearer " + token,
      "X-Target-Environment": config.targetEnvironment,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Could not verify MTN MoMo payment.");
  return data;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const referenceId = String(
      payload?.referenceId ||
      payload?.externalId ||
      payload?.data?.referenceId ||
      payload?.data?.externalId ||
      payload?.transactionReferenceId ||
      ""
    );
    if (!referenceId) return NextResponse.json({ received: true });

    const payment = await prisma.payment.findUnique({
      where: { txRef: referenceId },
      include: { order: { include: { items: true, couponUsage: true } } },
    });
    if (!payment) return NextResponse.json({ received: true });

    const result = await getPaymentStatus(referenceId);
    const status = normalizeStatus(result?.status || payload?.status);

    if (status === "SUCCESSFUL") {
      await prisma.$transaction(async (db) => {
        const fresh = await db.payment.findUnique({ where: { id: payment.id } });
        if (fresh?.status === "SUCCESSFUL") return;

        for (const item of payment.order.items) {
          if (item.variantId) {
            const changed = await db.productVariant.updateMany({
              where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (changed.count !== 1) throw new Error("One or more selected product options are no longer available.");
          } else {
            const changed = await db.product.updateMany({
              where: { id: item.productId, published: true, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (changed.count !== 1) throw new Error("One or more products are no longer available.");
          }
        }

        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESSFUL",
            provider: "mtn_momo",
            transactionId: String(result?.financialTransactionId || result?.financialTransactionId || referenceId),
          },
        });
        await db.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
        await db.cartItem.deleteMany({
          where: {
            userId: payment.order.userId,
            OR: payment.order.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
            })),
          },
        });
        if (payment.order.couponUsage) {
          await db.coupon.update({
            where: { id: payment.order.couponUsage.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      });
      await creditSellerWalletsForOrder(payment.orderId);
    } else if (status === "FAILED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          provider: "mtn_momo",
          transactionId: String(result?.financialTransactionId || referenceId),
        },
      });
      await prisma.order.update({ where: { id: payment.orderId }, data: { status: "CANCELLED" } });
      await prisma.delivery.update({ where: { orderId: payment.orderId }, data: { status: "CANCELLED" } });
    }

    return NextResponse.json({ received: true, status });
  } catch (error) {
    console.error("DIRECTE MTN MoMo payment callback failed:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
