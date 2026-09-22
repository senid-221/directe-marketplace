import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function normalizeStatus(value: unknown) {
  const status = String(value || "").toUpperCase();
  if (status === "COMPLETED" || status === "SUCCESSFUL") return "COMPLETED" as const;
  if (status === "FAILED") return "FAILED" as const;
  if (status === "CANCELLED") return "CANCELLED" as const;
  return "PROCESSING" as const;
}

async function verifyPayout(payoutId: string) {
  const token = process.env.PAWAPAY_API_TOKEN;
  const baseUrl = (process.env.PAWAPAY_API_URL || "https://api.sandbox.pawapay.io").replace(/\/$/, "");
  if (!token) throw new Error("PAWAPAY_API_TOKEN is not configured.");
  const response = await fetch(baseUrl + "/v2/payouts/" + encodeURIComponent(payoutId), {
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not verify PawaPay payout.");
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
    const payoutId = String(payload?.payoutId || payload?.data?.payoutId || "");
    if (!payoutId) return NextResponse.json({ received: true });

    const payout = await prisma.sellerPayout.findUnique({
      where: { providerPayoutId: payoutId },
      include: { seller: { include: { wallet: true } } },
    });
    if (!payout) return NextResponse.json({ received: true });

    const result = await verifyPayout(payoutId);
    const data = result?.data || result;
    const status = normalizeStatus(data?.status || payload?.status);

    if (status === "COMPLETED") {
      await prisma.$transaction(async (db) => {
        const fresh = await db.sellerPayout.findUnique({ where: { id: payout.id } });
        if (fresh?.status === "COMPLETED") return;
        await db.sellerPayout.update({
          where: { id: payout.id },
          data: {
            status: "COMPLETED",
            providerStatus: String(data?.status || "COMPLETED"),
            providerTransactionId: String(data?.providerTransactionId || data?.transactionId || payoutId),
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
    } else if (status === "FAILED" || status === "CANCELLED") {
      await prisma.$transaction(async (db) => {
        await db.sellerPayout.update({
          where: { id: payout.id },
          data: {
            status,
            providerStatus: String(data?.status || status),
            providerTransactionId: String(data?.providerTransactionId || data?.transactionId || payoutId),
            failureReason: String(data?.failureReason || data?.message || ""),
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("DIRECTE PawaPay payout callback failed:", error);
    return NextResponse.json({ received: true });
  }
}
