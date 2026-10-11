-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "SessionStatus" ADD VALUE 'EXPIRED';

-- DropIndex
DROP INDEX "CoachingSession_slotId_key";

-- AlterTable
ALTER TABLE "CoachingSession" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "compensationType" "CompensationType",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "payBy" TIMESTAMP(3),
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "respondedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "relatedCoachingSessionId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "coachingSessionId" TEXT;

-- CreateIndex
CREATE INDEX "CoachingSession_slotId_idx" ON "CoachingSession"("slotId");

-- CreateIndex
CREATE INDEX "CoachingSession_userId_idx" ON "CoachingSession"("userId");

-- CreateIndex
CREATE INDEX "CoachingSession_status_idx" ON "CoachingSession"("status");

-- CreateIndex
CREATE INDEX "Payment_coachingSessionId_idx" ON "Payment"("coachingSessionId");
