import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) return "+" + digits;
  if (digits.startsWith("0")) return "+250" + digits.slice(1);
  return "+" + digits;
}

export async function POST(request: Request) {
  const session = await requireAuth(["SELLER", "ADMIN"]);
  const body = await request.json().catch(() => ({}));
  const requestedSellerId = String(body.sellerId || "").trim();
  const amount = Number(body.amount);

  const currentSeller = session.role === "SELLER" ? await prisma.seller.findUnique({ where: { userId: session.userId } }) : null;
  const seller = await prisma.seller.findUnique({
    where: { id: requestedSellerId || currentSeller?.id || "" },
    include: { user: true, wallet: true },
  });

  if (!seller) return NextResponse.json({ error: "Seller account not found." }, { status: 404 });
  if (session.role === "SELLER" && seller.userId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (seller.status !== "APPROVED") return NextResponse.json({ error: "Seller is not approved." }, { status: 409 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Invalid payout amount." }, { status: 400 });
  if (!seller.payoutEnabled) return NextResponse.json({ error: "Seller payouts are not enabled yet." }, { status: 409 });

  const phone = seller.payoutPhone || seller.user.phone;
  if (!phone) return NextResponse.json({ error: "Add a payout phone number first." }, { status: 409 });
  if (!seller.wallet || Number(seller.wallet.availableBalance) < amount) {
    return NextResponse.json({ error: "Insufficient seller balance." }, { status: 409 });
  }

  const token = process.env.PAWAPAY_API_TOKEN;
  const baseUrl = (process.env.PAWAPAY_API_URL || "https://api.sandbox.pawapay.io").replace(/\/$/, "");
  if (!token) return NextResponse.json({ error: "PawaPay is not configured." }, { status: 503 });

  const payoutId = crypto.randomUUID();

  try {
    await prisma.$transaction(async (db) => {
      const fresh = await db.sellerWallet.findUnique({ where: { sellerId: seller.id } });
      if (!fresh || Number(fresh.availableBalance) < amount) throw new Error("INSUFFICIENT_BALANCE");

      await db.sellerWallet.update({
        where: { sellerId: seller.id },
        data: {
          availableBalance: { decrement: amount },
          pendingBalance: { increment: amount },
        },
      });
    });

    const response = await fetch(baseUrl + "/v2/payouts", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payoutId,
        amount: amount.toFixed(2),
        currency: "RWF",
        recipient: {
          type: "MMO",
          accountDetails: {
            phoneNumber: normalizePhone(phone),
            provider: seller.payoutProvider || "MTN_MOMO_RWA",
          },
        },
        customerMessage: "DIRECTE seller payout",
        clientReferenceId: seller.id,
        metadata: [{ fieldName: "sellerId", fieldValue: seller.id }],
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || "PawaPay payout request failed.");

    const payout = await prisma.$transaction(async (db) => {
      const created = await db.sellerPayout.create({
        data: {
          sellerId: seller.id,
          amount,
          currency: "RWF",
          provider: "pawapay",
          providerPayoutId: payoutId,
          status: "PROCESSING",
          phone: normalizePhone(phone),
          providerStatus: String(data?.status || "ACCEPTED"),
        },
      });
      const wallet = await db.sellerWallet.findUnique({ where: { sellerId: seller.id } });
      if (wallet) {
        await db.sellerLedgerEntry.create({
          data: {
            sellerWalletId: wallet.id,
            type: "PAYOUT",
            amount: -amount,
            payoutId: created.id,
            note: "PawaPay payout initiated.",
          },
        });
      }
      return created;
    });

    return NextResponse.json({ ok: true, payoutId, sellerPayoutId: payout.id, status: payout.status });
  } catch (error) {
    await prisma.sellerWallet.update({
      where: { sellerId: seller.id },
      data: { availableBalance: { increment: amount }, pendingBalance: { decrement: amount } },
    }).catch(() => null);

    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start payout." }, { status: 502 });
  }
}
