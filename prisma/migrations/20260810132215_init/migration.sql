/*
  Warnings:

  - You are about to drop the column `type` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "type";

-- DropEnum
DROP TYPE "ProductCategory";
