-- CreateIndex
CREATE INDEX "FieldReview_fieldId_createdAt_idx" ON "FieldReview"("fieldId", "createdAt");

-- AddForeignKey
ALTER TABLE "FieldReview" ADD CONSTRAINT "FieldReview_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
