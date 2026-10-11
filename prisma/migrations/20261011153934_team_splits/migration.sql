/*
  Warnings:

  - The `status` column on the `PaymentSplit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[reservationId,userId]` on the table `PaymentSplit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SplitStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CreditTxType" ADD VALUE 'EARNED_FROM_SPLIT';
ALTER TYPE "CreditTxType" ADD VALUE 'SPENT_ON_SPLIT';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TEAM_SPLIT_PAID';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "splitId" TEXT;

-- AlterTable
ALTER TABLE "PaymentSplit" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paidAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "SplitStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Payment_splitId_idx" ON "Payment"("splitId");

-- CreateIndex
CREATE INDEX "PaymentSplit_userId_idx" ON "PaymentSplit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSplit_reservationId_userId_key" ON "PaymentSplit"("reservationId", "userId");
