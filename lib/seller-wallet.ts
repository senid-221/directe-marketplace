import { prisma } from "@/lib/prisma";

export function sellerNetAmount(item: { quantity: number; unitPrice: unknown }, commissionPercent: number) {
  const gross = Number(item.unitPrice) * item.quantity;
  return Math.max(0, gross - (gross * commissionPercent / 100));
}

export async function creditSellerWalletsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status !== "PAID" && order.status !== "DELIVERED") return;

  const grouped = new Map<string, number>();
  for (const item of order.items) {
    const seller = await prisma.seller.findUnique({ where: { id: item.sellerId } });
    const commissionPercent = seller ? Number(seller.commission) : 0;
    const net = sellerNetAmount(item, commissionPercent);
    grouped.set(item.sellerId, (grouped.get(item.sellerId) || 0) + net);
  }

  for (const [sellerId, amount] of grouped) {
    if (amount <= 0) continue;
    await prisma.$transaction(async (db) => {
      const wallet = await db.sellerWallet.upsert({
        where: { sellerId },
        update: {
          availableBalance: { increment: amount },
          totalSales: { increment: amount },
        },
        create: {
          sellerId,
          availableBalance: amount,
          totalSales: amount,
        },
      });
      await db.sellerLedgerEntry.create({
        data: {
          sellerWalletId: wallet.id,
          type: "SALE",
          amount,
          orderId,
          note: "Seller net sale credited after payment.",
        },
      });
    });
  }
}

export async function requestSellerPayout(sellerId: string, amount: number) {
  if (amount <= 0) throw new Error("INVALID_AMOUNT");
  const seller = await prisma.seller.findUnique({ where: { id: sellerId }, include: { user: true, wallet: true } });
  if (!seller) throw new Error("SELLER_NOT_FOUND");
  if (!seller.payoutEnabled) throw new Error("PAYOUT_NOT_ENABLED");

  const phone = seller.payoutPhone || seller.user.phone;
  if (!phone) throw new Error("PAYOUT_PHONE_MISSING");
  if (!seller.wallet || Number(seller.wallet.availableBalance) < amount) throw new Error("INSUFFICIENT_BALANCE");

  const token = process.env.PAWAPAY_API_TOKEN;
  const baseUrl = (process.env.PAWAPAY_API_URL || "https://api.sandbox.pawapay.io").replace(/\/$/, "");
  if (!token) throw new Error("PAWAPAY_API_TOKEN_MISSING");

  const payoutId = crypto.randomUUID();

  await prisma.$transaction(async (db) => {
    const fresh = await db.sellerWallet.findUnique({ where: { sellerId } });
    if (!fresh || Number(fresh.availableBalance) < amount) throw new Error("INSUFFICIENT_BALANCE");

    await db.sellerWallet.update({
      where: { sellerId },
      data: {
        availableBalance: { decrement: amount },
        pendingBalance: { increment: amount },
      },
    });
  });

  try {
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
            phoneNumber: phone.replace(/^0/, "+250").replace(/^250/, "+250"),
            provider: seller.payoutProvider || "MTN_MOMO_RWA",
          },
        },
        customerMessage: "DIRECTE seller payout for " + seller.storeName,
        clientReferenceId: seller.id,
        metadata: [{ fieldName: "sellerId", fieldValue: seller.id }],
      }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || "PawaPay payout request failed.");

    await prisma.$transaction(async (db) => {
      const wallet = await db.sellerWallet.findUnique({ where: { sellerId } });
      const payout = await db.sellerPayout.create({
        data: {
          sellerId,
          amount,
          phone,
          providerPayoutId: payoutId,
          status: "PROCESSING",
          providerStatus: String(data?.status || "ACCEPTED"),
        },
      });
      if (wallet) {
        await db.sellerLedgerEntry.create({
          data: {
            sellerWalletId: wallet.id,
            type: "PAYOUT",
            amount: -amount,
            payoutId: payout.id,
            note: "PawaPay payout initiated.",
          },
        });
      }
    });

    return { payoutId, status: data?.status || "ACCEPTED" };
  } catch (error) {
    await prisma.sellerWallet.update({
      where: { sellerId },
      data: {
        availableBalance: { increment: amount },
        pendingBalance: { decrement: amount },
      },
    });
    throw error;
  }
}
