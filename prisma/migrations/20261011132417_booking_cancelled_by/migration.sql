-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('PLAYER', 'OWNER');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "cancelledBy" "CancelledBy";
