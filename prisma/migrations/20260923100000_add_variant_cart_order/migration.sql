ALTER TABLE "CartItem" ADD COLUMN "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_userId_productId_key";
CREATE UNIQUE INDEX "CartItem_userId_productId_variantId_key" ON "CartItem"("userId","productId","variantId");
CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;