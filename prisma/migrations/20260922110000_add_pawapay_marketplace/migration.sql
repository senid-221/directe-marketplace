CREATE TYPE "WalletEntryType" AS ENUM ('SALE','COMMISSION','PAYOUT','REFUND','ADJUSTMENT');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED');

ALTER TABLE "Seller" ADD COLUMN "payoutPhone" TEXT;
ALTER TABLE "Seller" ADD COLUMN "payoutProvider" TEXT NOT NULL DEFAULT 'MTN_MOMO_RWA';
ALTER TABLE "Seller" ADD COLUMN "payoutEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Payment" ALTER COLUMN "provider" SET DEFAULT 'pawapay';

CREATE TABLE "SellerWallet" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "availableBalance" DECIMAL NOT NULL DEFAULT 0,
  "pendingBalance" DECIMAL NOT NULL DEFAULT 0,
  "totalSales" DECIMAL NOT NULL DEFAULT 0,
  "totalPayouts" DECIMAL NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerWallet_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SellerLedgerEntry" (
  "id" TEXT NOT NULL,
  "sellerWalletId" TEXT NOT NULL,
  "type" "WalletEntryType" NOT NULL,
  "amount" DECIMAL NOT NULL,
  "orderId" TEXT,
  "payoutId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerLedgerEntry_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SellerPayout" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "provider" TEXT NOT NULL DEFAULT 'pawapay',
  "providerPayoutId" TEXT NOT NULL,
  "providerTransactionId" TEXT,
  "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "phone" TEXT NOT NULL,
  "providerStatus" TEXT,
  "failureReason" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "SellerPayout_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SellerWallet_sellerId_key" ON "SellerWallet"("sellerId");
CREATE INDEX "SellerLedgerEntry_sellerWalletId_createdAt_idx" ON "SellerLedgerEntry"("sellerWalletId","createdAt");
CREATE INDEX "SellerLedgerEntry_orderId_idx" ON "SellerLedgerEntry"("orderId");
CREATE INDEX "SellerLedgerEntry_payoutId_idx" ON "SellerLedgerEntry"("payoutId");
CREATE UNIQUE INDEX "SellerPayout_providerPayoutId_key" ON "SellerPayout"("providerPayoutId");
CREATE INDEX "SellerPayout_sellerId_status_idx" ON "SellerPayout"("sellerId","status");
CREATE INDEX "SellerPayout_providerStatus_idx" ON "SellerPayout"("providerStatus");

ALTER TABLE "SellerWallet" ADD CONSTRAINT "SellerWallet_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerLedgerEntry" ADD CONSTRAINT "SellerLedgerEntry_sellerWalletId_fkey" FOREIGN KEY ("sellerWalletId") REFERENCES "SellerWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
