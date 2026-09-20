import { prisma } from "@/lib/prisma";

export async function verifyAndFinalizePayment(txRef: string, transactionId: string) {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) throw new Error("Payment gateway is not configured.");

  const payment = await prisma.payment.findUnique({ where: { txRef }, include: { order: { include: { items: true } } } });
  if (!payment) throw new Error("Payment not found.");

  if (payment.status === "SUCCESSFUL" && payment.order.status === "PAID") {
    return { ok: true, orderId: payment.orderId, status: "successful" as const };
  }

  const response = await fetch("https://api.flutterwave.com/v3/transactions/" + encodeURIComponent(transactionId) + "/verify", {
    headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await response.json();
  const tx = data?.data;

  const valid = response.ok
    && data?.status === "success"
    && tx?.status === "successful"
    && tx?.tx_ref === txRef
    && tx?.currency === payment.currency
    && Number(tx?.amount) >= Number(payment.amount);

  if (!valid) {
    await prisma.payment.update({ where: { id: payment.id }, data: { transactionId: String(transactionId), status: tx?.status === "cancelled" ? "CANCELLED" : "FAILED" } });
    if (tx?.status === "cancelled") await prisma.order.update({ where: { id: payment.orderId }, data: { status: "CANCELLED" } });
    return { ok: false, orderId: payment.orderId, status: tx?.status || "failed" };
  }

  await prisma.$transaction(async (db) => {
    const freshPayment = await db.payment.findUnique({ where: { id: payment.id } });
    if (freshPayment?.status === "SUCCESSFUL") return;

    for (const item of payment.order.items) {
      const changed = await db.product.updateMany({
        where: { id: item.productId, published: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (changed.count !== 1) throw new Error("One or more products are no longer available.");
    }

    await db.payment.update({ where: { id: payment.id }, data: { transactionId: String(transactionId), status: "SUCCESSFUL" } });
    await db.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
    await db.cartItem.deleteMany({ where: { userId: payment.order.userId, productId: { in: payment.order.items.map((item) => item.productId) } } });
  });

  return { ok: true, orderId: payment.orderId, status: "successful" as const };
}
