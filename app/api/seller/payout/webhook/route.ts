import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeStatus(value: unknown) {
  const status = String(value || "").toUpperCase();
  if (status === "SUCCESSFUL" || status === "SUCCESS" || status === "COMPLETED") return "COMPLETED" as const;
  if (status === "FAILED" || status === "CANCELLED" || status === "REJECTED") return "FAILED" as const;
  return "PROCESSING" as const;
}

async function getConfig() {
  const apiUser = process.env.MTN_MOMO_API_USER;
  const apiKey = process.env.MTN_MOMO_API_KEY;
  const subscriptionKey = process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY;
  const baseUrl = (process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com").replace(/\/$/, "");
  const targetEnvironment = process.env.MTN_MOMO_TARGET_ENVIRONMENT || "sandbox";

  if (!apiUser || !apiKey || !subscriptionKey) {
    throw new Error("MTN_MOMO_NOT_CONFIGURED");
  }

  return { apiUser, apiKey, subscriptionKey, baseUrl, targetEnvironment };
}

async function getAccessToken(config: Awaited<ReturnType<typeof getConfig>>) {
  const basic = Buffer.from(config.apiUser + ":" + config.apiKey).toString("base64");
  const response = await fetch(config.baseUrl + "/disbursement/token/", {
    method: "POST",
    headers: {
      Authorization: "Basic " + basic,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw new Error("Could not get MTN MoMo disbursement access token.");
  }

  return String(data.access_token);
}

async function getPayoutStatus(referenceId: string) {
  const config = await getConfig();
  const token = await getAccessToken(config);

  const response = await fetch(
    config.baseUrl + "/disbursement/v1_0/transfer/" + encodeURIComponent(referenceId),
    {
      headers: {
        Authorization: "Bearer " + token,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error("Could not verify MTN MoMo payout.");
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const referenceId = String(
      payload?.referenceId ||
        payload?.data?.referenceId ||
        payload?.financialTransactionId ||
        "",
    );

    if (!referenceId) {
      return NextResponse.json({ received: true });
    }

    const payout = await prisma.sellerPayout.findUnique({
      where: { providerPayoutId: referenceId },
      include: { seller: { include: { wallet: true } } },
    });

    if (!payout) {
      return NextResponse.json({ received: true });
    }

    const result = await getPayoutStatus(referenceId);
    const status = normalizeStatus(result?.status || payload?.status);

    if (status === "COMPLETED") {
      await prisma.$transaction(async (db) => {
        const fresh = await db.sellerPayout.findUnique({
          where: { id: payout.id },
        });

        if (fresh?.status === "COMPLETED") return;

        await db.sellerPayout.update({
          where: { id: payout.id },
          data: {
            status: "COMPLETED",
            providerStatus: String(result?.status || "SUCCESSFUL"),
            providerTransactionId: String(
              result?.financialTransactionId || referenceId,
            ),
            completedAt: new Date(),
          },
        });

        if (payout.seller.wallet) {
          await db.sellerWallet.update({
            where: { sellerId: payout.sellerId },
            data: {
              pendingBalance: { decrement: payout.amount },
              totalPayouts: { increment: payout.amount },
            },
          });
        }
      });
    } else if (status === "FAILED") {
      await prisma.$transaction(async (db) => {
        const fresh = await db.sellerPayout.findUnique({
          where: { id: payout.id },
        });

        if (!fresh || ["COMPLETED", "FAILED", "CANCELLED"].includes(fresh.status)) {
          return;
        }

        await db.sellerPayout.update({
          where: { id: payout.id },
          data: {
            status: "FAILED",
            providerStatus: String(result?.status || "FAILED"),
            providerTransactionId: String(
              result?.financialTransactionId || referenceId,
            ),
            failureReason: String(
              result?.reason ||
                result?.message ||
                payload?.reason ||
                "MTN MoMo payout failed.",
            ),
          },
        });

        if (payout.seller.wallet) {
          await db.sellerWallet.update({
            where: { sellerId: payout.sellerId },
            data: {
              pendingBalance: { decrement: payout.amount },
              availableBalance: { increment: payout.amount },
            },
          });
        }
      });
    }

    return NextResponse.json({ received: true, status });
  } catch (error) {
    console.error("DIRECTE MTN MoMo payout callback failed:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
