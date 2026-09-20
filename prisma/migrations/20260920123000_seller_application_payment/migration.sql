-- AkaziConnect seller application payment fields
ALTER TABLE "Seller" ADD COLUMN "plan" TEXT;
ALTER TABLE "Seller" ADD COLUMN "planAmount" DECIMAL;
ALTER TABLE "Seller" ADD COLUMN "paymentStatus" "PaymentStatus";
ALTER TABLE "Seller" ADD COLUMN "paymentMethod" "PaymentMethod";
ALTER TABLE "Seller" ADD COLUMN "paymentTxRef" TEXT;
ALTER TABLE "Seller" ADD COLUMN "paymentTxnId" TEXT;
CREATE UNIQUE INDEX "Seller_paymentTxRef_key" ON "Seller"("paymentTxRef");
CREATE INDEX "Seller_paymentStatus_idx" ON "Seller"("paymentStatus");
