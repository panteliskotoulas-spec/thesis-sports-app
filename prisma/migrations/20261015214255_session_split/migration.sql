-- CreateTable
CREATE TABLE "SessionSplit" (
    "id" TEXT NOT NULL,
    "coachingSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "SplitStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionSplit_userId_idx" ON "SessionSplit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionSplit_coachingSessionId_userId_key" ON "SessionSplit"("coachingSessionId", "userId");
