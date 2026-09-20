import { prisma } from "@/lib/prisma";

export async function verifyAndFinalizeSellerPayment(txRef: string, transactionId: string) {
  const seller = await prisma.seller.findUnique({ where: { paymentTxRef: txRef }, include: { user: true } });
  if (!seller) throw new Error("SELLER_PAYMENT_NOT_FOUND");
  if (seller.paymentStatus === "SUCCESSFUL") return { ok: true, sellerId: seller.id };

  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) throw new Error("FLW_SECRET_KEY_MISSING");

  const response = await fetch("https://api.flutterwave.com/v3/transactions/" + encodeURIComponent(transactionId) + "/verify", {
    headers: { Authorization: "Bearer " + secret },
    cache: "no-store",
  });
  const data = await response.json();
  const tx = data?.data;
  const expectedAmount = Number(seller.planAmount || 0);
  const paidAmount = Number(tx?.amount || 0);

  if (!response.ok || data.status !== "success" || tx?.status !== "successful" || tx?.tx_ref !== txRef || tx?.currency !== "RWF" || paidAmount < expectedAmount) {
    await prisma.seller.update({ where: { id: seller.id }, data: { paymentStatus: "FAILED", paymentTxnId: transactionId } });
    throw new Error("SELLER_PAYMENT_VERIFICATION_FAILED");
  }

  await prisma.seller.update({
    where: { id: seller.id },
    data: { paymentStatus: "SUCCESSFUL", paymentTxnId: transactionId, status: "PENDING" },
  });

  return { ok: true, sellerId: seller.id };
}
