-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "maxTeams" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "sportType" "SportType";

UPDATE "Tournament" AS t
SET "sportType" = COALESCE(
  (SELECT f."sports"[1] FROM "Field" AS f WHERE f."id" = t."hostFieldId"),
  'FOOTBALL'
);

ALTER TABLE "Tournament" ALTER COLUMN "sportType" SET NOT NULL;

ALTER TABLE "Tournament"
ALTER COLUMN "description" TYPE JSONB
USING jsonb_build_object('el', "description", 'en', "description");

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "slotId",
DROP COLUMN "playerStats",
ADD COLUMN     "round" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "sets" JSONB;

ALTER TABLE "Match" ALTER COLUMN "round" DROP DEFAULT;

-- CreateTable
CREATE TABLE "MatchPlayerStat" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stats" JSONB NOT NULL,

    CONSTRAINT "MatchPlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchPlayerStat_userId_idx" ON "MatchPlayerStat"("userId");

-- CreateIndex
CREATE INDEX "MatchPlayerStat_teamId_idx" ON "MatchPlayerStat"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayerStat_matchId_userId_key" ON "MatchPlayerStat"("matchId", "userId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_round_idx" ON "Match"("tournamentId", "round");

-- CreateIndex
CREATE INDEX "Tournament_sportType_status_idx" ON "Tournament"("sportType", "status");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerStat" ADD CONSTRAINT "MatchPlayerStat_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerStat" ADD CONSTRAINT "MatchPlayerStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayerStat" ADD CONSTRAINT "MatchPlayerStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;