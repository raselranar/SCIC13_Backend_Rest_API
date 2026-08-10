/*
  Warnings:

  - A unique constraint covering the columns `[orderId,productId]` on the table `order_item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "order_item_orderId_productId_key" ON "order_item"("orderId", "productId");
