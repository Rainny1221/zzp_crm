
-- CreateTable
CREATE TABLE "crm_customer_business_profiles" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "shop_name" TEXT NOT NULL,
    "tiktok_link" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gmv_monthly" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "industry" TEXT,
    "job_title" TEXT,
    "province" TEXT,
    "partner_name" TEXT,
    "source_note" TEXT,
    "synced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "crm_customer_business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deal_details" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "closed_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "trial_start_date" TIMESTAMPTZ(6),
    "trial_end_date" TIMESTAMPTZ(6),
    "failure_reason_code" TEXT,
    "failure_note" TEXT,
    "last_contacted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "crm_deal_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deal_payments" (
    "id" SERIAL NOT NULL,
    "deal_detail_id" INTEGER NOT NULL,
    "plan_name" TEXT NOT NULL,
    "paid_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "package_end_date" TIMESTAMPTZ(6) NOT NULL,
    "carry_over_days" INTEGER NOT NULL DEFAULT 0,
    "sales_commission" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_deal_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "activity_type_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "author_user_id" INTEGER,
    "author_name" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tasks" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "task_type_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "due_date" TIMESTAMPTZ(6) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "assignee_user_id" INTEGER,
    "priority_code" TEXT NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_feedbacks" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "category_code" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sales_user_id" INTEGER,
    "sales_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_feedback_reads" (
    "id" SERIAL NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_feedback_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_notifications" (
    "id" SERIAL NOT NULL,
    "type_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customer_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_notification_reads" (
    "id" SERIAL NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_sales_kpi_quotas" (
    "id" SERIAL NOT NULL,
    "sales_member_id" INTEGER NOT NULL,
    "period_code" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "quota" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "crm_sales_kpi_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_failure_reasons" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_failure_reasons_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_feedback_categories" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_feedback_categories_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_notification_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_notification_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_interaction_channels" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_interaction_channels_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_call_outcomes" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_call_outcomes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_message_outcomes" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_message_outcomes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_task_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_task_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_priorities" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_priorities_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_pipeline_stage_notes" (
    "stage_code" TEXT NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "crm_pipeline_stage_notes_pkey" PRIMARY KEY ("stage_code")
);

-- CreateTable
CREATE TABLE "crm_sales_members" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "crm_role" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "crm_sales_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_customer_business_profiles_customer_id_key" ON "crm_customer_business_profiles"("customer_id");

-- CreateIndex
CREATE INDEX "crm_customer_business_profiles_shop_name_idx" ON "crm_customer_business_profiles"("shop_name");

-- CreateIndex
CREATE INDEX "crm_customer_business_profiles_email_idx" ON "crm_customer_business_profiles"("email");

-- CreateIndex
CREATE INDEX "crm_customer_business_profiles_phone_idx" ON "crm_customer_business_profiles"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "crm_deal_details_deal_id_key" ON "crm_deal_details"("deal_id");

-- CreateIndex
CREATE INDEX "crm_deal_details_failure_reason_code_idx" ON "crm_deal_details"("failure_reason_code");

-- CreateIndex
CREATE INDEX "crm_deal_details_trial_end_date_idx" ON "crm_deal_details"("trial_end_date");

-- CreateIndex
CREATE INDEX "crm_deal_details_last_contacted_at_idx" ON "crm_deal_details"("last_contacted_at");

-- CreateIndex
CREATE INDEX "crm_deal_payments_deal_detail_id_idx" ON "crm_deal_payments"("deal_detail_id");

-- CreateIndex
CREATE INDEX "crm_deal_payments_paid_at_idx" ON "crm_deal_payments"("paid_at");

-- CreateIndex
CREATE INDEX "crm_activities_customer_id_occurred_at_idx" ON "crm_activities"("customer_id", "occurred_at");

-- CreateIndex
CREATE INDEX "crm_activities_activity_type_code_idx" ON "crm_activities"("activity_type_code");

-- CreateIndex
CREATE INDEX "crm_activities_author_user_id_idx" ON "crm_activities"("author_user_id");

-- CreateIndex
CREATE INDEX "crm_tasks_customer_id_completed_due_date_idx" ON "crm_tasks"("customer_id", "completed", "due_date");

-- CreateIndex
CREATE INDEX "crm_tasks_assignee_user_id_completed_due_date_idx" ON "crm_tasks"("assignee_user_id", "completed", "due_date");

-- CreateIndex
CREATE INDEX "crm_tasks_priority_code_idx" ON "crm_tasks"("priority_code");

-- CreateIndex
CREATE INDEX "crm_feedbacks_customer_id_idx" ON "crm_feedbacks"("customer_id");

-- CreateIndex
CREATE INDEX "crm_feedbacks_category_code_idx" ON "crm_feedbacks"("category_code");

-- CreateIndex
CREATE INDEX "crm_feedbacks_sales_user_id_idx" ON "crm_feedbacks"("sales_user_id");

-- CreateIndex
CREATE INDEX "crm_feedbacks_created_at_idx" ON "crm_feedbacks"("created_at");

-- CreateIndex
CREATE INDEX "crm_feedback_reads_user_id_idx" ON "crm_feedback_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_feedback_reads_feedback_id_user_id_key" ON "crm_feedback_reads"("feedback_id", "user_id");

-- CreateIndex
CREATE INDEX "crm_notifications_type_code_idx" ON "crm_notifications"("type_code");

-- CreateIndex
CREATE INDEX "crm_notifications_customer_id_idx" ON "crm_notifications"("customer_id");

-- CreateIndex
CREATE INDEX "crm_notifications_created_at_idx" ON "crm_notifications"("created_at");

-- CreateIndex
CREATE INDEX "crm_notification_reads_user_id_idx" ON "crm_notification_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_notification_reads_notification_id_user_id_key" ON "crm_notification_reads"("notification_id", "user_id");

-- CreateIndex
CREATE INDEX "crm_sales_kpi_quotas_period_code_idx" ON "crm_sales_kpi_quotas"("period_code");

-- CreateIndex
CREATE INDEX "crm_sales_kpi_quotas_period_start_period_end_idx" ON "crm_sales_kpi_quotas"("period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "crm_sales_kpi_quotas_sales_member_id_period_code_key" ON "crm_sales_kpi_quotas"("sales_member_id", "period_code");

-- CreateIndex
CREATE INDEX "crm_statuses_sort_order_idx" ON "crm_statuses"("sort_order");

-- CreateIndex
CREATE INDEX "crm_failure_reasons_sort_order_idx" ON "crm_failure_reasons"("sort_order");

-- CreateIndex
CREATE INDEX "crm_feedback_categories_sort_order_idx" ON "crm_feedback_categories"("sort_order");

-- CreateIndex
CREATE INDEX "crm_notification_types_sort_order_idx" ON "crm_notification_types"("sort_order");

-- CreateIndex
CREATE INDEX "crm_interaction_channels_sort_order_idx" ON "crm_interaction_channels"("sort_order");

-- CreateIndex
CREATE INDEX "crm_call_outcomes_sort_order_idx" ON "crm_call_outcomes"("sort_order");

-- CreateIndex
CREATE INDEX "crm_message_outcomes_sort_order_idx" ON "crm_message_outcomes"("sort_order");

-- CreateIndex
CREATE INDEX "crm_task_types_sort_order_idx" ON "crm_task_types"("sort_order");

-- CreateIndex
CREATE INDEX "crm_priorities_sort_order_idx" ON "crm_priorities"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "crm_sales_members_user_id_key" ON "crm_sales_members"("user_id");

-- CreateIndex
CREATE INDEX "crm_sales_members_crm_role_idx" ON "crm_sales_members"("crm_role");

-- CreateIndex
CREATE INDEX "crm_sales_members_is_active_idx" ON "crm_sales_members"("is_active");

-- AddForeignKey
ALTER TABLE "crm_deal_payments" ADD CONSTRAINT "crm_deal_payments_deal_detail_id_fkey" FOREIGN KEY ("deal_detail_id") REFERENCES "crm_deal_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_feedback_reads" ADD CONSTRAINT "crm_feedback_reads_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "crm_feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notification_reads" ADD CONSTRAINT "crm_notification_reads_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "crm_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_sales_kpi_quotas" ADD CONSTRAINT "crm_sales_kpi_quotas_sales_member_id_fkey" FOREIGN KEY ("sales_member_id") REFERENCES "crm_sales_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
