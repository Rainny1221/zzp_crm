/*
  MANUAL-REVIEWED MIGRATION
  refactor_crm_independent_sync
*/

-- =========================================================
-- STEP 1: CREATE ENUM FOR CRM SYNC JOBS
-- =========================================================

CREATE TYPE "CrmSyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');


-- =========================================================
-- STEP 2: DROP OLD UNIQUE ON PIPELINE HISTORY
-- history table không được unique theo deal_id nữa
-- =========================================================

DROP INDEX IF EXISTS "crm_pipeline_records_deal_id_key";


-- =========================================================
-- STEP 3: OPTIONAL EVENT TABLE ALIGNMENT
-- crm_pipeline_events không còn event_key trong schema mới
-- =========================================================

DROP INDEX IF EXISTS "crm_pipeline_events_event_key_key";

ALTER TABLE "crm_pipeline_events"
DROP COLUMN IF EXISTS "event_key",
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);


-- =========================================================
-- STEP 4: CRM TABLE ALTERS / INDEXES
-- chỉ giữ các thay đổi thật sự liên quan CRM
-- =========================================================

ALTER TABLE "crm_customer_profiles"
    ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

ALTER TABLE "crm_deals"
    ALTER COLUMN "product_package" SET DEFAULT 'starter',
ALTER COLUMN "deal_value" SET DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'new',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

ALTER TABLE "crm_pipeline_records"
    ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);


-- =========================================================
-- STEP 5: CREATE CRM SYNC JOBS TABLE
-- trigger trên users sẽ chỉ enqueue vào đây
-- =========================================================

CREATE TABLE "crm_sync_jobs" (
                                 "id" SERIAL NOT NULL,
                                 "event_key" TEXT NOT NULL,
                                 "event_type" TEXT NOT NULL,
                                 "user_id" INTEGER NOT NULL,
                                 "payload" JSONB,
                                 "status" "CrmSyncJobStatus" NOT NULL DEFAULT 'PENDING',
                                 "retry_count" INTEGER NOT NULL DEFAULT 0,
                                 "last_error" TEXT,
                                 "locked_at" TIMESTAMPTZ(6),
                                 "processed_at" TIMESTAMPTZ(6),
                                 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 "updated_at" TIMESTAMPTZ(6) NOT NULL,

                                 CONSTRAINT "crm_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_sync_jobs_event_key_key"
    ON "crm_sync_jobs"("event_key");

CREATE INDEX "crm_sync_jobs_status_created_at_idx"
    ON "crm_sync_jobs"("status", "created_at");

CREATE INDEX "crm_sync_jobs_user_id_idx"
    ON "crm_sync_jobs"("user_id");


-- =========================================================
-- STEP 6: CRM PERFORMANCE INDEXES
-- =========================================================

CREATE INDEX "crm_customer_profiles_owner_id_idx"
    ON "crm_customer_profiles"("owner_id");

CREATE INDEX "crm_customer_profiles_source_code_idx"
    ON "crm_customer_profiles"("source_code");

CREATE INDEX "crm_customer_profiles_tier_code_idx"
    ON "crm_customer_profiles"("tier_code");

CREATE INDEX "crm_deals_owner_id_idx"
    ON "crm_deals"("owner_id");

CREATE INDEX "crm_deals_product_package_idx"
    ON "crm_deals"("product_package");

CREATE INDEX "crm_deals_status_idx"
    ON "crm_deals"("status");

CREATE INDEX "crm_pipeline_records_deal_id_created_at_idx"
    ON "crm_pipeline_records"("deal_id", "created_at");

CREATE INDEX "crm_pipeline_records_owner_id_idx"
    ON "crm_pipeline_records"("owner_id");

CREATE INDEX "crm_pipeline_stages_stage_order_idx"
    ON "crm_pipeline_stages"("stage_order");


-- =========================================================
-- STEP 7: FK FOR CRM SYNC JOBS
-- =========================================================

ALTER TABLE "crm_sync_jobs"
    ADD CONSTRAINT "crm_sync_jobs_user_id_fkey"
        FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE RESTRICT
            ON UPDATE CASCADE;


-- =========================================================
-- STEP 8: SEED LOOKUPS
-- =========================================================

INSERT INTO crm_sources (code, label)
VALUES
    ('website', 'Website Register'),
    ('manual', 'Manual'),
    ('tiktok', 'TikTok')
    ON CONFLICT (code) DO NOTHING;

INSERT INTO crm_tiers (code, label)
VALUES
    ('399', 'Gói 399k'),
    ('699', 'Gói 699k'),
    ('trial', 'Trial')
    ON CONFLICT (code) DO NOTHING;

INSERT INTO crm_pipeline_stages (
    code,
    label,
    stage_order,
    mapped_status_code,
    is_terminal,
    is_active
)
VALUES
    ('NEW_LEAD',
     'New Lead - Khách hàng mới thêm vào CRM',
     1,
     'NEW',
     false,
     true),

    ('CONNECT',
     'Connect - Đã có giao tiếp với khách hàng',
     2,
     'CONNECT',
     false,
     true),

    ('QUALIFIED',
     'Qualified - Đã xác nhận khách hàng mục tiêu',
     3,
     'QUALIFIED',
     false,
     true),

    ('BOOKING_DEMO',
     'Booking Demo - Đã hẹn lịch tư vấn',
     4,
     'BOOKING_DEMO',
     false,
     true),

    ('DEMO',
     'Demo - Đã tư vấn',
     5,
     'DEMO',
     false,
     true),

    ('PROPOSAL',
     'Proposal - Đã gửi tài liệu',
     6,
     'PROPOSAL',
     false,
     true),

    ('NEGOTIATION',
     'Negotiation - Chờ thanh toán',
     7,
     'NEGOTIATION',
     false,
     true),

    ('CLOSE_DEAL',
     'Close Deal - Đã thanh toán',
     8,
     'WON',
     true,
     true),

    ('FAIL',
     'Fail - Khách hàng không mua thời điểm này',
     9,
     'FAIL',
     true,
     true),

    ('LOST',
     'Lost/Unqualified - Loại bỏ',
     10,
     'LOST',
     true,
     true)
    ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- STEP 9: SAFE LOGGING FUNCTION
-- crm_pipeline_events chỉ là audit log, không dùng event_key nữa
-- =========================================================

CREATE OR REPLACE FUNCTION crm_log_event(
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id INT,
  p_payload JSONB,
  p_status "CrmEventStatus" DEFAULT 'SUCCESS',
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
INSERT INTO crm_pipeline_events (
    event_type,
    entity_type,
    entity_id,
    payload,
    status,
    error_message,
    created_at
)
VALUES (
           p_event_type,
           p_entity_type,
           p_entity_id,
           p_payload,
           p_status,
           p_error,
           NOW()
       );

EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$$ LANGUAGE plpgsql;


-- =========================================================
-- STEP 10: DROP OLD CHAIN TRIGGERS / FUNCTIONS
-- xóa flow cũ users -> customer -> deal -> pipeline
-- =========================================================

DROP TRIGGER IF EXISTS trg_users_create_crm_profile ON users;
DROP TRIGGER IF EXISTS trg_customer_create_deal ON crm_customer_profiles;
DROP TRIGGER IF EXISTS trg_deal_create_pipeline ON crm_deals;
DROP TRIGGER IF EXISTS trg_deal_update_stage_pipeline ON crm_deals;
DROP TRIGGER IF EXISTS trg_profile_create_pipeline ON crm_customer_profiles;

DROP FUNCTION IF EXISTS crm_create_customer_profile();
DROP FUNCTION IF EXISTS crm_create_deal();
DROP FUNCTION IF EXISTS crm_create_pipeline_record();
DROP FUNCTION IF EXISTS crm_log_stage_change();


-- =========================================================
-- STEP 11: USERS -> CRM_SYNC_JOBS
-- trigger duy nhất giữ trong DB
-- =========================================================

CREATE OR REPLACE FUNCTION crm_enqueue_user_created()
RETURNS TRIGGER AS $$
DECLARE
v_event_key TEXT;
BEGIN
  v_event_key := 'USER_CREATED:' || NEW.id::TEXT;

INSERT INTO crm_sync_jobs (
    event_key,
    event_type,
    user_id,
    payload,
    status,
    retry_count,
    created_at,
    updated_at
)
VALUES (
           v_event_key,
           'USER_CREATED',
           NEW.id,
           jsonb_build_object(
                   'user_id', NEW.id,
                   'email', NEW.email,
                   'username', NEW.username,
                   'phone_number', NEW.phone_number,
                   'brand_name', NEW.brand_name,
                   'created_at', NEW.created_at
           ),
           'PENDING',
           0,
           NOW(),
           NOW()
       )
    ON CONFLICT (event_key) DO NOTHING;

PERFORM crm_log_event(
    'ENQUEUE_CRM_SYNC_JOB',
    'user',
    NEW.id,
    jsonb_build_object(
      'event_key', v_event_key,
      'user_id', NEW.id
    ),
    'SUCCESS',
    NULL
  );

RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  PERFORM crm_log_event(
    'ENQUEUE_CRM_SYNC_JOB',
    'user',
    NEW.id,
    jsonb_build_object(
      'event_key', v_event_key,
      'user_id', NEW.id
    ),
    'FAILED',
    SQLERRM
  );

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_enqueue_crm_sync ON users;

CREATE TRIGGER trg_users_enqueue_crm_sync
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION crm_enqueue_user_created();