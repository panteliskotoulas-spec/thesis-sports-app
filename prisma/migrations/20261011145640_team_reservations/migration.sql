-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TEAM_RESERVATION_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'TEAM_RESERVATION_CANCELLED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "Reservation_teamId_idx" ON "Reservation"("teamId");
