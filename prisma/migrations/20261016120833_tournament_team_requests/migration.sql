-- CreateEnum
CREATE TYPE "TournamentRequestStatus" AS ENUM ('PENDING', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TOURNAMENT_REQUEST_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'TOURNAMENT_REQUEST_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'TOURNAMENT_REQUEST_REJECTED';

-- CreateTable
CREATE TABLE "TournamentTeamRequest" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" "TournamentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentTeamRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentTeamRequest_tournamentId_status_idx" ON "TournamentTeamRequest"("tournamentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeamRequest_tournamentId_teamId_key" ON "TournamentTeamRequest"("tournamentId", "teamId");

-- AddForeignKey
ALTER TABLE "TournamentTeamRequest" ADD CONSTRAINT "TournamentTeamRequest_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeamRequest" ADD CONSTRAINT "TournamentTeamRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
