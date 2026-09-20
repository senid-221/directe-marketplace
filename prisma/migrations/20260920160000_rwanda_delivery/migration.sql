CREATE TYPE "DeliveryStatus" AS ENUM (
  'PENDING',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "Delivery" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "trackingCode" TEXT NOT NULL,
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "recipientName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "sector" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "deliveryFee" DECIMAL NOT NULL,
  "estimatedDate" TIMESTAMP(3),
  "assignedAt" TIMESTAMP(3),
  "pickedUpAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");
CREATE UNIQUE INDEX "Delivery_trackingCode_key" ON "Delivery"("trackingCode");
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");
CREATE INDEX "Delivery_district_idx" ON "Delivery"("district");

ALTER TABLE "Delivery"
ADD CONSTRAINT "Delivery_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
