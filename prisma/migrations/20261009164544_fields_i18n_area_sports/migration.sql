/*
  Warnings:

  - Added the required column `area` to the `Field` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `Field` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `description` on the `Field` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "area" JSONB NOT NULL,
ADD COLUMN     "sports" "SportType"[] DEFAULT ARRAY[]::"SportType"[],
DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB NOT NULL;
