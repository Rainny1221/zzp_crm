-- DropIndex
DROP INDEX "matching_user1_pending_idx";

-- DropIndex
DROP INDEX "matching_user2_pending_idx";

-- CreateTable
CREATE TABLE "user_hobbies" (
    "user_id" INTEGER NOT NULL,
    "hobby_id" INTEGER NOT NULL,

    CONSTRAINT "user_hobbies_pkey" PRIMARY KEY ("user_id","hobby_id")
);

-- CreateIndex
CREATE INDEX "matching_user1_pending_idx" ON "matching_actions"("user_1_id") WHERE ("status" = 'PENDING');

-- CreateIndex
CREATE INDEX "matching_user2_pending_idx" ON "matching_actions"("user_2_id") WHERE ("status" = 'PENDING');

-- AddForeignKey
ALTER TABLE "user_hobbies" ADD CONSTRAINT "user_hobbies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hobbies" ADD CONSTRAINT "user_hobbies_hobby_id_fkey" FOREIGN KEY ("hobby_id") REFERENCES "hobbies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
