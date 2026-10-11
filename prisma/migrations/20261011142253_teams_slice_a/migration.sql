/*
  Warnings:

  - The `status` column on the `JoinRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[teamId,userId]` on the table `TeamMembership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,sportType]` on the table `TeamMembership` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sportType` to the `TeamMembership` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TeamLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "JoinRequest" DROP CONSTRAINT "JoinRequest_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMembership" DROP CONSTRAINT "TeamMembership_teamId_fkey";

-- AlterTable
ALTER TABLE "JoinRequest" DROP COLUMN "status",
ADD COLUMN     "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "area" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" JSONB,
ADD COLUMN     "level" "TeamLevel" NOT NULL DEFAULT 'INTERMEDIATE',
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 12;

-- AlterTable
ALTER TABLE "TeamMembership" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sportType" "SportType" NOT NULL;

-- CreateIndex
CREATE INDEX "JoinRequest_teamId_status_idx" ON "JoinRequest"("teamId", "status");

-- CreateIndex
CREATE INDEX "JoinRequest_userId_teamId_idx" ON "JoinRequest"("userId", "teamId");

-- CreateIndex
CREATE INDEX "Team_sportType_isRecruiting_idx" ON "Team"("sportType", "isRecruiting");

-- CreateIndex
CREATE INDEX "TeamMembership_teamId_idx" ON "TeamMembership"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_teamId_userId_key" ON "TeamMembership"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_userId_sportType_key" ON "TeamMembership"("userId", "sportType");

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
