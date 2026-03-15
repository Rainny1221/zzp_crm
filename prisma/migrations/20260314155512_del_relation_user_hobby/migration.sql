/*
  Warnings:

  - You are about to drop the column `user_id` on the `hobbies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "hobbies" DROP CONSTRAINT "hobbies_user_id_fkey";

-- DropIndex
DROP INDEX "matching_user1_pending_idx";

-- DropIndex
DROP INDEX "matching_user2_pending_idx";

-- AlterTable
ALTER TABLE "hobbies" DROP COLUMN "user_id";

-- CreateIndex
CREATE INDEX "matching_user1_pending_idx" ON "matching_actions"("user_1_id") WHERE ("status" = 'PENDING');

-- CreateIndex
CREATE INDEX "matching_user2_pending_idx" ON "matching_actions"("user_2_id") WHERE ("status" = 'PENDING');
