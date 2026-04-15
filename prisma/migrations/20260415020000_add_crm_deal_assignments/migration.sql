-- CreateTable
CREATE TABLE "crm_deal_assignments" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "from_user_id" INTEGER,
    "to_user_id" INTEGER,
    "note" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_deal_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_deal_assignments_deal_id_created_at_idx" ON "crm_deal_assignments"("deal_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_deal_assignments_customer_id_created_at_idx" ON "crm_deal_assignments"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "crm_deal_assignments_from_user_id_idx" ON "crm_deal_assignments"("from_user_id");

-- CreateIndex
CREATE INDEX "crm_deal_assignments_to_user_id_idx" ON "crm_deal_assignments"("to_user_id");

-- CreateIndex
CREATE INDEX "crm_deal_assignments_created_by_idx" ON "crm_deal_assignments"("created_by");

-- AddForeignKey
ALTER TABLE "crm_deal_assignments" ADD CONSTRAINT "crm_deal_assignments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_assignments" ADD CONSTRAINT "crm_deal_assignments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "crm_customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_assignments" ADD CONSTRAINT "crm_deal_assignments_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_assignments" ADD CONSTRAINT "crm_deal_assignments_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deal_assignments" ADD CONSTRAINT "crm_deal_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
