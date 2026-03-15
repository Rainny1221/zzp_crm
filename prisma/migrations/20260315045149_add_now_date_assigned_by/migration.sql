/*
  Warnings:

  - Made the column `assigned_at` on table `user_roles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "matching_user1_pending_idx";

-- DropIndex
DROP INDEX "matching_user2_pending_idx";

-- AlterTable
ALTER TABLE "user_roles" ALTER COLUMN "assigned_at" SET NOT NULL,
ALTER COLUMN "assigned_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "matching_user1_pending_idx" ON "matching_actions"("user_1_id") WHERE ("status" = 'PENDING');

-- CreateIndex
CREATE INDEX "matching_user2_pending_idx" ON "matching_actions"("user_2_id") WHERE ("status" = 'PENDING');
