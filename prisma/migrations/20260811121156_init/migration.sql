/*
  Warnings:

  - You are about to drop the column `unitPrice` on the `order_item` table. All the data in the column will be lost.
  - Added the required column `price` to the `order_item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_item" DROP COLUMN "unitPrice",
ADD COLUMN     "price" INTEGER NOT NULL;
