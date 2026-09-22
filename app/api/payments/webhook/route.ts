import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function normalizeStatus(value: unknown) {
  const status = String(value || "").toUpperCase();
  if (status === "COMPLETED" || status === "SUCCESSFUL") return "SUCCESSFUL" as const;
  if (status === "FAILED" || status === "CANCELLED") return "FAILED" as const;
  return "PENDING" as const;
}

async function verifyDeposit(depositId: string) {
  const token = process.env.PAWAPAY_API_TOKEN;
  const baseUrl = (process.env.PAWAPAY_API_URL || "https://api.sandbox.pawapay.io").replace(/\/$/, "");
  if (!token) throw new Error("PAWAPAY_API_TOKEN is not configured.");
  const response = await fetch(baseUrl + "/v2/deposits/" + encodeURIComponent(depositId), {
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not verify PawaPay deposit.");
  return response.json();
}

export async function POST(request: Request) {
  const raw = await request.text();

  const callbackSecret = process.env.PAWAPAY_CALLBACK_SECRET;
  if (callbackSecret) {
    const provided = request.headers.get("x-directe-callback-secret");
    if (!provided || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(callbackSecret))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(raw);
    const depositId = String(payload?.depositId || payload?.data?.depositId || "");
    if (!depositId) return NextResponse.json({ received: true });

    const payment = await prisma.payment.findUnique({
      where: { txRef: depositId },
      include: { order: { include: { items: true, couponUsage: true } } },
    });
    if (!payment) return NextResponse.json({ received: true });

    const result = await verifyDeposit(depositId);
    const data = result?.data || result;
    const status = normalizeStatus(data?.status || payload?.status);

    if (status === "SUCCESSFUL") {
      await prisma.$transaction(async (db) => {
        const fresh = await db.payment.findUnique({ where: { id: payment.id } });
        if (fresh?.status === "SUCCESSFUL") return;

        for (const item of payment.order.items) {
          const changed = await db.product.updateMany({
            where: { id: item.productId, published: true, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (changed.count !== 1) throw new Error("One or more products are no longer available.");
        }

        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESSFUL",
            provider: "pawapay",
            transactionId: String(data?.providerTransactionId || data?.transactionId || depositId),
          },
        });
        await db.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
        await db.cartItem.deleteMany({
          where: {
            userId: payment.order.userId,
            productId: { in: payment.order.items.map((item) => item.productId) },
          },
        });
        if (payment.order.couponUsage) {
          await db.coupon.update({
            where: { id: payment.order.couponUsage.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      });
    } else if (status === "FAILED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          provider: "pawapay",
          transactionId: String(data?.providerTransactionId || data?.transactionId || depositId),
        },
      });
      await prisma.order.update({ where: { id: payment.orderId }, data: { status: "CANCELLED" } });
      await prisma.delivery.update({ where: { orderId: payment.orderId }, data: { status: "CANCELLED" } });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("DIRECTE PawaPay payment callback failed:", error);
    return NextResponse.json({ received: true });
  }
}
