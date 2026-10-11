/*
  Warnings:

  - Changed the type of `bio` on the `Coach` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rejectionReason" JSONB,
DROP COLUMN "bio",
ADD COLUMN     "bio" JSONB NOT NULL;
