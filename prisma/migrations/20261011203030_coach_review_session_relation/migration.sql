-- CreateIndex
CREATE INDEX "CoachReview_coachId_createdAt_idx" ON "CoachReview"("coachId", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachReview" ADD CONSTRAINT "CoachReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
