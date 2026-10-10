-- DropIndex
DROP INDEX "Reservation_slotId_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "holdExpiresAt" TIMESTAMP(3),
ADD COLUMN     "slotId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_reservationId_idx" ON "Payment"("reservationId");

-- CreateIndex
CREATE INDEX "Payment_sessionId_idx" ON "Payment"("sessionId");

-- CreateIndex
CREATE INDEX "Payment_slotId_idx" ON "Payment"("slotId");

-- CreateIndex
CREATE INDEX "Reservation_slotId_idx" ON "Reservation"("slotId");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");
