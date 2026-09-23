import { prisma } from "@/lib/prisma";

export function sellerNetAmount(item: { quantity: number; unitPrice: unknown }, commissionPercent: number) {
  const gross = Number(item.unitPrice) * item.quantity;
  return Math.max(0, gross - (gross * commissionPercent / 100));
}

export async function creditSellerWalletsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
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
      const existingSale = await db.sellerLedgerEntry.findFirst({
        where: { sellerWallet: { sellerId }, orderId, type: "SALE" },
      });
      if (existingSale) return;

      const wallet = await db.sellerWallet.upsert({
        where: { sellerId },
        update: { availableBalance: { increment: amount }, totalSales: { increment: amount } },
        create: { sellerId, availableBalance: amount, totalSales: amount },
      });
      await db.sellerLedgerEntry.create({
        data: {
          sellerWalletId: wallet.id,
          type: "SALE",
          amount,
          orderId,
          note: "Seller net sale credited after successful payment.",
        },
      });
    });
  }
}
