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

function getConfig() {
  const apiUser = process.env.MTN_MOMO_API_USER;
  const apiKey = process.env.MTN_MOMO_API_KEY;
  const subscriptionKey = process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY;
  const baseUrl = (process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com").replace(/\/$/, "");
  const targetEnvironment = process.env.MTN_MOMO_TARGET_ENVIRONMENT || "sandbox";
  if (!apiUser || !apiKey || !subscriptionKey) return null;
  return { apiUser, apiKey, subscriptionKey, baseUrl, targetEnvironment };
}

async function getAccessToken(config: NonNullable<ReturnType<typeof getConfig>>) {
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
  if (!response.ok || !data?.access_token) throw new Error("Could not get MTN MoMo disbursement access token.");
  return String(data.access_token);
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["SELLER", "ADMIN"]);
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const requestedSellerId = String(body.sellerId || "").trim();
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Invalid payout amount." }, { status: 400 });

    const currentSeller = session.role === "SELLER" ? await prisma.seller.findUnique({ where: { userId: session.userId } }) : null;
    const seller = await prisma.seller.findUnique({
      where: { id: requestedSellerId || currentSeller?.id || "" },
      include: { user: true, wallet: true },
    });
    if (!seller) return NextResponse.json({ error: "Seller account not found." }, { status: 404 });
    if (session.role === "SELLER" && seller.userId !== session.userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (session.role === "ADMIN" && !requestedSellerId) return NextResponse.json({ error: "sellerId is required for admin payouts." }, { status: 400 });
    if (seller.status !== "APPROVED") return NextResponse.json({ error: "Seller is not approved." }, { status: 409 });
    if (!seller.payoutEnabled) return NextResponse.json({ error: "Seller payouts are not enabled yet." }, { status: 409 });

    const phone = seller.payoutPhone || seller.user.phone;
    if (!phone) return NextResponse.json({ error: "Add a payout phone number first." }, { status: 409 });
    if (!seller.wallet || Number(seller.wallet.availableBalance) < amount) return NextResponse.json({ error: "Insufficient seller balance." }, { status: 409 });

    const config = getConfig();
    if (!config) return NextResponse.json({ error: "MTN MoMo Disbursements API is not configured." }, { status: 503 });

    const payoutId = crypto.randomUUID();
    await prisma.$transaction(async (db) => {
      const fresh = await db.sellerWallet.findUnique({ where: { sellerId: seller.id } });
      if (!fresh || Number(fresh.availableBalance) < amount) throw new Error("INSUFFICIENT_BALANCE");
      await db.sellerWallet.update({
        where: { sellerId: seller.id },
        data: { availableBalance: { decrement: amount }, pendingBalance: { increment: amount } },
      });
    });

    try {
      const accessToken = await getAccessToken(config);
      const response = await fetch(config.baseUrl + "/disbursement/v1_0/transfer", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "X-Reference-Id": payoutId,
          "X-Target-Environment": config.targetEnvironment,
          "Ocp-Apim-Subscription-Key": config.subscriptionKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount.toFixed(2),
          currency: "RWF",
          externalId: seller.id,
          payee: { partyIdType: "MSISDN", partyId: normalizePhone(phone).replace(/\D/g, "") },
          payerMessage: "DIRECTE seller payout",
          payeeNote: "DIRECTE seller payout",
        }),
        cache: "no-store",
      });
      if (!response.ok && response.status !== 202) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Could not start MTN MoMo payout.");
      }

      const payout = await prisma.sellerPayout.create({
        data: {
          sellerId: seller.id,
          amount,
          currency: "RWF",
          provider: "mtn_momo",
          providerPayoutId: payoutId,
          status: "PROCESSING",
          phone: normalizePhone(phone),
          providerStatus: "PENDING",
        },
      });
      await prisma.sellerLedgerEntry.create({
        data: {
          sellerWalletId: seller.wallet!.id,
          type: "PAYOUT",
          amount: -amount,
          payoutId: payout.id,
          note: "MTN MoMo payout initiated.",
        },
      });

      return NextResponse.json({ ok: true, payoutId, sellerPayoutId: payout.id, status: payout.status });
    } catch (error) {
      await prisma.sellerWallet.update({
        where: { sellerId: seller.id },
        data: { availableBalance: { increment: amount }, pendingBalance: { decrement: amount } },
      }).catch(() => null);
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: "Insufficient seller balance." }, { status: 409 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start payout." }, { status: 502 });
  }
}
