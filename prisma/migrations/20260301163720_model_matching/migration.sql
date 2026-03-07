-- CreateEnum
CREATE TYPE "UserAction" AS ENUM ('LIKE', 'DISLIKE', 'SUPERLIKE');

-- CreateEnum
CREATE TYPE "MatchingStatus" AS ENUM ('PENDING', 'ACCEPT', 'REJECT');

-- CreateTable
CREATE TABLE "matching_actions" (
    "id" SERIAL NOT NULL,
    "user_1_id" INTEGER NOT NULL,
    "user_2_id" INTEGER NOT NULL,
    "user_1_action" "UserAction",
    "user_2_action" "UserAction",
    "status" "MatchingStatus" NOT NULL DEFAULT 'PENDING',
    "matched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "updated_by" INTEGER,
    "deleted_by" INTEGER,

    CONSTRAINT "matching_actions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE matching_actions
ADD CONSTRAINT matching_user_order_check
CHECK (user_1_id::text < user_2_id::text);

-- CreateIndex
CREATE INDEX "matching_user1_idx" ON "matching_actions"("user_1_id");

-- CreateIndex
CREATE INDEX "matching_user2_idx" ON "matching_actions"("user_2_id");

-- CreateIndex
CREATE INDEX "matching_actions_user_1_id_matched_at_idx" ON "matching_actions"("user_1_id", "matched_at");

-- CreateIndex
CREATE INDEX "matching_actions_user_2_id_matched_at_idx" ON "matching_actions"("user_2_id", "matched_at");

-- CreateIndex
CREATE INDEX "matching_user1_pending_idx" ON "matching_actions"("user_1_id") WHERE ("status" = 'PENDING');

-- CreateIndex
CREATE INDEX "matching_user2_pending_idx" ON "matching_actions"("user_2_id") WHERE ("status" = 'PENDING');

-- CreateIndex
CREATE UNIQUE INDEX "matching_actions_user_1_id_user_2_id_key" ON "matching_actions"("user_1_id", "user_2_id");
