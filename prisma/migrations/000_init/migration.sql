-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "file_status_enum" AS ENUM ('uploading', 'processing', 'ready', 'error');

-- CreateEnum
CREATE TYPE "interacts_type_enum" AS ENUM ('LOVE', 'DISLOVE', 'COMMENT', 'REPLYCOMMENT');

-- CreateEnum
CREATE TYPE "node_type_enum" AS ENUM ('folder', 'file');

-- CreateEnum
CREATE TYPE "referral_type" AS ENUM ('NEW', 'OLD');

-- CreateEnum
CREATE TYPE "CrmEventStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "address" (
    "id" BIGSERIAL NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "is_default" BOOLEAN DEFAULT false,
    "type" VARCHAR(255)
);

-- CreateTable
CREATE TABLE "admin_notification_inbox" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255),
    "content" TEXT,
    "related_user_id" BIGINT,
    "source_type" VARCHAR(20),
    "sender_name" VARCHAR(100),
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "notification_id" BIGINT,
    "notification_custom_id" BIGINT,

    CONSTRAINT "admin_notification_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aff_campaign_categories" (
    "id" SERIAL NOT NULL,
    "aff_campaign_id" INTEGER,
    "category" VARCHAR NOT NULL
);

-- CreateTable
CREATE TABLE "aff_campaigns" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "thumbnail_name" TEXT,
    "status" VARCHAR(255),
    "additional_data" JSONB,
    "sell_area" TEXT,
    "product_remaining" INTEGER,
    "product_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "province_code" VARCHAR(255),
    "district_code" VARCHAR(255),
    "ward_code" VARCHAR(255),
    "total_kol_submission" INTEGER DEFAULT 0,
    "scheduled_start_time" TIMESTAMPTZ(6),
    "referral_id" INTEGER,
    "published_at" TIMESTAMPTZ(6),
    "brand_name" VARCHAR(255),
    "is_self_face_required" BOOLEAN DEFAULT false,
    "brand_tap_id" INTEGER,
    "shop_name" VARCHAR(255),
    "is_need_gmv" BOOLEAN DEFAULT false,
    "aff_campaign_type" VARCHAR[] DEFAULT ARRAY['VIDEO']::VARCHAR[],
    "type" VARCHAR(255) DEFAULT 'NORMAL',
    "clip_simple_url" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "cash_amount" DECIMAL,
    "is_private" BOOLEAN DEFAULT false,
    "limit" INTEGER,
    "categories_tap" TEXT,
    "need_draft_approval" BOOLEAN,
    "deadline" TIMESTAMPTZ(6),
    "hashtag" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "ads_commission_rate" VARCHAR(255),
    "total_koc" INTEGER DEFAULT 0,
    "re_published_at" TIMESTAMPTZ(6),

    CONSTRAINT "aff_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chats" (
    "id" SERIAL NOT NULL,
    "role" VARCHAR(255),
    "content" TEXT,
    "room_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apps" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "version" TEXT,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" SERIAL NOT NULL,
    "account_number" VARCHAR,
    "bank_code" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "account_holder_name" VARCHAR(255),
    "is_default" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "banks" (
    "id" SERIAL NOT NULL,
    "bank_name" VARCHAR(255),
    "description" VARCHAR(255),
    "code" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "thumbnail" VARCHAR(255)
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" SERIAL NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "title" TEXT,
    "thumbnail" TEXT,
    "status" VARCHAR(255),
    "type" VARCHAR(255),
    "content_en" TEXT,
    "content_zh" TEXT,
    "title_en" TEXT,
    "title_zh" TEXT,
    "mode" VARCHAR(255),

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_subscriptions" (
    "id" SERIAL NOT NULL,
    "price_at_time" DECIMAL,
    "payment_method" SMALLINT,
    "started_at" TIMESTAMPTZ(6),
    "expired_at" TIMESTAMPTZ(6),
    "status" VARCHAR(255),
    "plan_pricing_id" SMALLINT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "brand_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_taps" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "tag_name" VARCHAR(255),
    "brand_approved_count" INTEGER DEFAULT 0,
    "brand_rejected_count" INTEGER DEFAULT 0,
    "bd_approved_count" INTEGER DEFAULT 0,
    "bd_rejected_count" INTEGER DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "is_send_brand" BOOLEAN DEFAULT false,
    "total_show" VARCHAR(255) DEFAULT 'ALL',
    "last_active_at" TIMESTAMPTZ(6),
    "is_auto_order" BOOLEAN DEFAULT false,

    CONSTRAINT "brand_taps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_name" VARCHAR(255),
    "tax_code" VARCHAR(255),
    "company_address" VARCHAR(255),
    "representative_name" VARCHAR(255),
    "representative_position" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "brand_core_id" INTEGER,

    CONSTRAINT "brandss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands_info" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_name" VARCHAR(255),
    "tax_code" VARCHAR(255),
    "company_address" VARCHAR(255),
    "representative_name" VARCHAR(255),
    "representative_position" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_categories" (
    "id" SERIAL,
    "campaign_id" INTEGER,
    "category_id" INTEGER NOT NULL,
    "cost_per_view_campaign_id" INTEGER
);

-- CreateTable
CREATE TABLE "campaign_inspiration" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(500),
    "campaign_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "type" VARCHAR(255),
    "cost_per_view_campaign_id" INTEGER,
    "aff_campaign_id" INTEGER,

    CONSTRAINT "campaign_inspiration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_tasks" (
    "id" SERIAL NOT NULL,
    "start_time" TIMESTAMPTZ(6),
    "end_time" TIMESTAMPTZ(6),
    "campaign_id" INTEGER,
    "task_id" INTEGER,
    "campaign_type" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "worked_by" INTEGER,
    "status" VARCHAR(255),

    CONSTRAINT "campaign_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "draft_due_dates" TEXT[],
    "description" TEXT,
    "publish_at" TIMESTAMPTZ(6),
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "is_user_generated" BOOLEAN,
    "is_ship" BOOLEAN DEFAULT true,
    "thumbnail_name" VARCHAR,
    "kol_gender" VARCHAR,
    "price_per_kol" INTEGER,
    "kol_limit" INTEGER,
    "is_public" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "user_id" INTEGER,
    "status" VARCHAR(255),
    "additional_data" JSONB,
    "kol_age_from" SMALLINT,
    "kol_age_to" SMALLINT,
    "kol_follower_from" BIGINT,
    "kol_follower_to" BIGINT,
    "province_code" VARCHAR(255),
    "district_code" VARCHAR(255),
    "ward_code" VARCHAR(255),
    "sell_area" TEXT,
    "total_kol_submission" INTEGER DEFAULT 0,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "categories_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" BIGINT,
    "sender_id" BIGINT,
    "content" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "updated_at" TIMESTAMP(6),
    "updated_by" BIGINT,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(100),
    "seen_by" TEXT,
    "attachment_url" VARCHAR[],
    "type" VARCHAR(255),

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheating_login" (
    "id" SERIAL NOT NULL,
    "link_tiktok" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "cheating_login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_galleries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(500),
    "comment_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "type" VARCHAR(255),

    CONSTRAINT "comment_galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "content" TEXT,
    "parent_id" VARCHAR,
    "total_comment" VARCHAR DEFAULT '0',
    "draft_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "type" VARCHAR(255),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" BIGSERIAL NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "is_default" BOOLEAN DEFAULT false,
    "type" VARCHAR(255),
    "full_name" VARCHAR(255),
    "phone_number" VARCHAR(255),
    "province_code" VARCHAR(255),
    "district_code" VARCHAR(255),
    "ward_code" VARCHAR(255),
    "next_updated_at" TIMESTAMPTZ(6),
    "is_default_verify" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "content_performance_daily" (
    "id" BIGSERIAL NOT NULL,
    "creator_content_id" INTEGER NOT NULL,
    "content_id" VARCHAR(255),
    "view_count" INTEGER,
    "like_count" INTEGER,
    "share_count" INTEGER,
    "comment_num" INTEGER,
    "save_count" INTEGER,
    "paid_order_num" INTEGER,
    "paid_amount" DECIMAL(18,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "cl_pay_sub_order_cnt" INTEGER,
    "sponsor_est_comm_amt" VARCHAR(50),
    "sponsor_paid_comm_amt" INTEGER,
    "metric_date" DATE,

    CONSTRAINT "content_performance_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" BIGSERIAL NOT NULL,
    "contract_mobi_id" VARCHAR(255),
    "user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "status" VARCHAR(255),
    "metadata" JSONB
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT,
    "user_id" BIGINT,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "updated_at" TIMESTAMP(6),
    "updated_by" BIGINT,
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(100),
    "status" VARCHAR(255),
    "aff_campaign_id" INTEGER,
    "kol_submission_id" INTEGER,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_per_view_campaigns" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "description" TEXT,
    "publish_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "thumbnail_name" VARCHAR,
    "kol_gender" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "status" VARCHAR(255),
    "additional_data" JSONB,
    "kol_age_from" SMALLINT,
    "kol_age_to" SMALLINT,
    "kol_follower_from" BIGINT,
    "kol_follower_to" BIGINT,
    "maximum_budget" DECIMAL(10,2),
    "maximum_views" DECIMAL(10,2),
    "province_code" VARCHAR(255),
    "district_code" VARCHAR(255),
    "ward_code" VARCHAR(255),
    "sell_area" TEXT,
    "total_kol_submission" INTEGER DEFAULT 0,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "cost_per_view_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_content" (
    "id" SERIAL NOT NULL,
    "creator_username" VARCHAR(255),
    "content_id" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "thumbnail_video_url" VARCHAR,
    "linked_tiktok_video" VARCHAR,
    "source_url" VARCHAR,
    "published_date" BIGINT,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "code_ads" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "creator_id" VARCHAR(255),
    "video_title" TEXT,
    "video_duration" VARCHAR(255),
    "is_own_tap" BOOLEAN,
    "has_paid_order" BOOLEAN DEFAULT false,
    "draft_id" INTEGER,
    "total_paid_amount" DECIMAL,
    "order_id" VARCHAR(255),
    "hash_tags" VARCHAR[],
    "click_through_rate" DECIMAL,
    "product_id" VARCHAR(255),
    "seller_id" VARCHAR(100),
    "is_received_sample" BOOLEAN,
    "is_crawl_received_sample" BOOLEAN DEFAULT false,
    "campaign_id" VARCHAR(255),
    "is_live" BOOLEAN,
    "metric_date" DATE,
    "views" INTEGER,
    "likes" INTEGER,
    "shares" INTEGER,
    "comments" INTEGER,
    "new_followers" INTEGER,

    CONSTRAINT "creator_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_profile_snapshot" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "creator_username" VARCHAR(255) NOT NULL,
    "creator_oecu_id" VARCHAR(255),
    "creator_id" VARCHAR(255),
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "creator_avatar_url" TEXT,
    "follower_count" DECIMAL,
    "total_gmv" DECIMAL,
    "nickname" TEXT,

    CONSTRAINT "creator_profile_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255),
    "province_code" VARCHAR,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_galleries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(500),
    "draft_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "type" VARCHAR(255),
    "is_remove_on_aws" BOOLEAN DEFAULT false,

    CONSTRAINT "draft_galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drafts" (
    "id" SERIAL NOT NULL,
    "content" TEXT,
    "status" TEXT,
    "potential_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "version" DECIMAL DEFAULT 1,
    "submit_url" TEXT,
    "reason" VARCHAR(255),
    "reject_description" VARCHAR(255),
    "submit_at" TIMESTAMPTZ(6),
    "code_ads" VARCHAR(255),
    "kol_submission_id" INTEGER,
    "view" INTEGER,
    "like" INTEGER,
    "comment" INTEGER,
    "share" INTEGER,
    "request_product_sample_id" INTEGER,
    "video_id" VARCHAR(255),
    "shop_name" VARCHAR(255),
    "is_attach_shop_cart" BOOLEAN,
    "is_koc_deleted" BOOLEAN,
    "is_koc_hidden" BOOLEAN,
    "thumbnail_video_url" TEXT,
    "reject_acceptance_at" TIMESTAMPTZ(6),
    "accept_acceptance_at" TIMESTAMPTZ(6),
    "creator_content_id" INTEGER,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "metadata" JSONB,
    "status" VARCHAR(255)
);

-- CreateTable
CREATE TABLE "file_imports" (
    "id" SERIAL NOT NULL,
    "file_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "error_log" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "file_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hide_skus" (
    "id" SERIAL NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "hide_skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" SERIAL,
    "date" DATE NOT NULL,
    "name" VARCHAR(255),
    "country_code" VARCHAR(10) DEFAULT 'VN',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER
);

-- CreateTable
CREATE TABLE "interacts" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "interacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_receive_sample_reminders" (
    "id" BIGSERIAL NOT NULL,
    "kol_submission_id" INTEGER NOT NULL,
    "attempt_no" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "canceled_at" TIMESTAMPTZ(6),
    "notification_custom_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "invite_receive_sample_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL,
    "currency" VARCHAR(255),
    "status" VARCHAR(255),
    "customer_type" VARCHAR(255),
    "customer_name" VARCHAR(255),
    "tax_code_or_cccd" VARCHAR(255),
    "representative" VARCHAR(255),
    "phone_number" VARCHAR(255),
    "email" VARCHAR(255),
    "address" TEXT,
    "transaction_id" INTEGER
);

-- CreateTable
CREATE TABLE "kol_brand_taps" (
    "id" SERIAL NOT NULL,
    "brand_tap_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "brand_action" VARCHAR(255),

    CONSTRAINT "kol_brand_taps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_pricing" (
    "id" SERIAL NOT NULL,
    "price" DECIMAL NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "content_type" VARCHAR(255),
    "platform_id" INTEGER,
    "content" TEXT,
    "content_duration_type" VARCHAR(255),

    CONSTRAINT "kol_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_submissions" (
    "id" SERIAL NOT NULL,
    "confirmed_by" INTEGER,
    "status" VARCHAR(255),
    "campaign_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "cover_letter" TEXT,
    "reason" TEXT,
    "description" TEXT,
    "cost_per_view_campaign_id" INTEGER,
    "aff_campaign_id" INTEGER,
    "is_brand_confirm" BOOLEAN DEFAULT false,
    "next_status" VARCHAR(255),
    "working_at" TIMESTAMPTZ(6),
    "total_clip" DECIMAL DEFAULT 1,
    "content_type" VARCHAR[] DEFAULT ARRAY['VIDEO']::VARCHAR[],
    "brand_approved_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "tiktok_username" VARCHAR(255),
    "product_id" INTEGER,
    "has_been_overdue" BOOLEAN DEFAULT false,
    "reason_reject_acceptance" VARCHAR(255),
    "sample_order_settings_id" SMALLINT,
    "seller_id" VARCHAR(255),

    CONSTRAINT "kol_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_paths" (
    "ancestor_id" INTEGER NOT NULL,
    "descendant_id" INTEGER NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "node_paths_pkey" PRIMARY KEY ("ancestor_id","descendant_id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "type" "node_type_enum" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "storage_key" TEXT,
    "size_bytes" BIGINT,
    "mime_type" VARCHAR(100),
    "status" "file_status_enum",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_campaigns" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(255),
    "body" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "is_read" BOOLEAN DEFAULT false,
    "additional_data" JSONB,

    CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_customs" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(255),
    "body" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "is_read" BOOLEAN DEFAULT false,
    "receiver_id" BIGINT,
    "additional_data" JSONB,
    "is_sent" BOOLEAN DEFAULT false,
    "is_priority" BOOLEAN DEFAULT false,

    CONSTRAINT "notification_customs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(255),
    "body" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "is_read" BOOLEAN DEFAULT false,
    "receiver_id" BIGINT,
    "additional_data" JSONB,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_creator_content" (
    "id" SERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "creator_content_id" BIGINT NOT NULL,
    "order_line_item_id" INTEGER,

    CONSTRAINT "order_creator_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_line_items" (
    "id" SERIAL,
    "order_id" VARCHAR(255) NOT NULL,
    "order_line_item_id" VARCHAR(255),
    "currency" VARCHAR(10),
    "original_price" DECIMAL,
    "sale_price" DECIMAL,
    "gift_retail_price" DECIMAL,
    "platform_discount" DECIMAL,
    "seller_discount" DECIMAL,
    "is_gift" BOOLEAN DEFAULT false,
    "product_id" VARCHAR(255),
    "product_name" TEXT,
    "sku_id" VARCHAR(255),
    "sku_name" VARCHAR(255),
    "sku_type" VARCHAR(100),
    "sku_image" TEXT,
    "seller_sku" VARCHAR(255),
    "package_id" VARCHAR(255),
    "package_status" VARCHAR(100),
    "shipping_provider_id" VARCHAR(255),
    "shipping_provider_name" VARCHAR(255),
    "tracking_number" VARCHAR(255),
    "rts_time" TIMESTAMPTZ(6),
    "display_status" VARCHAR(100),
    "cancel_reason" VARCHAR(255),
    "cancel_user" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "voucher_deduction_platform" DECIMAL(18,2),
    "voucher_deduction_seller" DECIMAL(18,2),
    "shipping_fee_deduction_platform_voucher" DECIMAL(18,2)
);

-- CreateTable
CREATE TABLE "order_logistics" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "description" VARCHAR(255),
    "event_time" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_logistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_packages" (
    "id" SERIAL,
    "package_id" VARCHAR(255) NOT NULL,
    "order_id" VARCHAR(255) NOT NULL
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" SERIAL,
    "order_id" VARCHAR(255) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "sub_total" DECIMAL(18,2) DEFAULT 0,
    "tax" DECIMAL(18,2) DEFAULT 0,
    "shipping_fee" DECIMAL(18,2) DEFAULT 0,
    "original_total_product_price" DECIMAL(18,2) DEFAULT 0,
    "original_shipping_fee" DECIMAL(18,2) DEFAULT 0,
    "platform_discount" DECIMAL(18,2) DEFAULT 0,
    "seller_discount" DECIMAL(18,2) DEFAULT 0,
    "shipping_fee_platform_discount" DECIMAL(18,2) DEFAULT 0,
    "shipping_fee_seller_discount" DECIMAL(18,2) DEFAULT 0,
    "shipping_fee_cofunded_discount" DECIMAL(18,2) DEFAULT 0,
    "total_amount" DECIMAL(18,2) DEFAULT 0,
    "payment_method_name" VARCHAR(100),
    "seller_id" VARCHAR(255),
    "is_sample_order" BOOLEAN,
    "partner_id" VARCHAR(255),
    "creator_id" VARCHAR(255),
    "net_price_amount" DECIMAL(18,2),
    "payment" DECIMAL(18,2),
    "shipping_fee_deduction_seller" DECIMAL(18,2),
    "shipping_fee_deduction_platform" DECIMAL(18,2),
    "shipping_fee_deduction_platform_voucher" DECIMAL(18,2),
    "shipping_list_price" DECIMAL(18,2),
    "shipping_sale_price" DECIMAL(18,2),
    "sku_gift_original_price" DECIMAL(18,2),
    "sku_list_price" DECIMAL(18,2),
    "sku_sale_price" DECIMAL(18,2),
    "subtotal_tax_amount" DECIMAL(18,2),
    "subtotal_deduction_platform" DECIMAL(18,2),
    "subtotal_deduction_seller" DECIMAL(18,2),
    "tax_amount" DECIMAL(18,2),
    "total" DECIMAL(18,2),
    "voucher_deduction_platform" DECIMAL(18,2),
    "voucher_deduction_seller" DECIMAL(18,2),
    "creator_username" VARCHAR,
    "order_created_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER
);

-- CreateTable
CREATE TABLE "order_recipients" (
    "id" SERIAL,
    "order_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "phone_number" VARCHAR(50),
    "region_code" VARCHAR(10),
    "postal_code" VARCHAR(50),
    "full_address" TEXT,
    "address_detail" TEXT,
    "district_info" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6)
);

-- CreateTable
CREATE TABLE "order_skus" (
    "id" SERIAL,
    "order_id" VARCHAR(255) NOT NULL,
    "product_id" VARCHAR(255) NOT NULL,
    "quantity" INTEGER,
    "refunded_quantity" INTEGER,
    "returned_quantity" INTEGER,
    "price" JSONB NOT NULL DEFAULT '{}',
    "commission_model" VARCHAR(100),
    "commission_rate" DECIMAL,
    "commission_tier_setting" VARCHAR(255),
    "estimated_commission_base" JSONB NOT NULL DEFAULT '{}',
    "estimated_paid_commission" JSONB NOT NULL DEFAULT '{}',
    "estimated_cofunded_creator_bonus_amount" JSONB NOT NULL DEFAULT '{}',
    "estimated_paid_shop_ads_commission" JSONB NOT NULL DEFAULT '{}',
    "actual_commission_base" JSONB NOT NULL DEFAULT '{}',
    "actual_paid_commission" JSONB NOT NULL DEFAULT '{}',
    "actual_cofunded_creator_bonus_amount" JSONB NOT NULL DEFAULT '{}',
    "actual_paid_shop_ads_commission" JSONB NOT NULL DEFAULT '{}',
    "creator_username" VARCHAR(255),
    "content_id" VARCHAR(255),
    "content_type" VARCHAR(50),
    "campaign_id" VARCHAR(255),
    "open_collaboration_id" VARCHAR(255),
    "target_collaboration_id" VARCHAR(255),
    "creator_commission_rate" DECIMAL,
    "tap_commission_rate" DECIMAL,
    "creator_commission_reward_rate" DECIMAL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "partner_id" VARCHAR(255),
    "partner_name" VARCHAR(255),
    "campaign_name" TEXT,
    "shop_ads_commission_rate" VARCHAR(50),
    "settlement_status" VARCHAR(100),
    "fully_return" VARCHAR(10),
    "estimated_paid_partner_commission" JSONB NOT NULL DEFAULT '{}',
    "actual_paid_partner_commission" JSONB NOT NULL DEFAULT '{}',
    "sku_id" VARCHAR(255),
    "partner_commission_rate" VARCHAR(50)
);

-- CreateTable
CREATE TABLE "order_transactions" (
    "id" SERIAL NOT NULL,
    "order_id" VARCHAR(255) NOT NULL,
    "currency" VARCHAR(20),
    "order_created_at" TIMESTAMPTZ(6),
    "revenue_amount" DECIMAL(18,2),
    "settlement_amount" DECIMAL(18,2),
    "shipping_cost_amount" DECIMAL(18,2),
    "fee_and_tax_amount" DECIMAL(18,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "total_count" INTEGER,

    CONSTRAINT "order_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_id" VARCHAR(255) NOT NULL,
    "quantity" INTEGER,
    "tracking_number" VARCHAR(255),
    "delivery_service" VARCHAR(255),
    "status" VARCHAR(255) NOT NULL,
    "sku_id" VARCHAR(255),
    "kol_submission_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "buyer_user_id" VARCHAR(255),
    "buyer_email" VARCHAR(255),
    "buyer_message" TEXT,
    "delivery_option_id" VARCHAR(255),
    "delivery_option_name" VARCHAR(255),
    "delivery_time" TIMESTAMPTZ(6),
    "delivery_type" VARCHAR(255),
    "collection_due_time" TIMESTAMPTZ(6),
    "collection_time" TIMESTAMPTZ(6),
    "fulfillment_priority_level" INTEGER,
    "fulfillment_type" VARCHAR(100),
    "recommended_shipping_time" TIMESTAMPTZ(6),
    "shipping_due_time" TIMESTAMPTZ(6),
    "shipping_provider" VARCHAR(255),
    "shipping_provider_id" VARCHAR(255),
    "shipping_type" VARCHAR(255),
    "cancel_order_sla_time" TIMESTAMPTZ(6),
    "create_time" TIMESTAMPTZ(6) NOT NULL,
    "has_updated_recipient_address" BOOLEAN,
    "is_cod" BOOLEAN,
    "is_on_hold_order" BOOLEAN,
    "is_replacement_order" BOOLEAN,
    "paid_time" TIMESTAMPTZ(6),
    "payment_method_name" VARCHAR(255),
    "is_sample_order" BOOLEAN,
    "rts_sla_time" TIMESTAMPTZ(6),
    "rts_time" TIMESTAMPTZ(6),
    "tts_sla_time" TIMESTAMPTZ(6),
    "order_type" VARCHAR(100),
    "split_or_combine_tag" VARCHAR(255),
    "update_time" TIMESTAMPTZ(6),
    "commerce_platform" VARCHAR(100),
    "warehouse_id" VARCHAR(255),
    "campaign_id" VARCHAR(255),
    "creator_username" TEXT,
    "partner_id" VARCHAR(255),
    "seller_id" VARCHAR(255) NOT NULL,
    "source" VARCHAR NOT NULL,
    "creator_id" VARCHAR(255),
    "cancel_time" TIMESTAMPTZ(6),
    "cancel_reason" VARCHAR(255),
    "partner_name" VARCHAR,
    "sample_order_id" VARCHAR(255),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders_tap" (
    "id" SERIAL NOT NULL,
    "order_id" VARCHAR(255) NOT NULL,
    "quantity" INTEGER,
    "tracking_number" VARCHAR(255),
    "delivery_service" VARCHAR(255),
    "status" VARCHAR(255),
    "product_id" INTEGER,
    "sku_id" INTEGER,
    "kol_submission_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "orders_tap_seq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,

    CONSTRAINT "otp_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_users" (
    "id" SERIAL NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "user_relationship_id" INTEGER NOT NULL,

    CONSTRAINT "permission_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "limit_value" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price_monthly" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "price_yearly" DECIMAL(12,2),

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms_campaigns" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER,
    "platform_id" INTEGER NOT NULL,
    "potential_id" INTEGER NOT NULL,
    "cost_per_view_campaign_id" INTEGER,
    "aff_campaign_id" INTEGER,

    CONSTRAINT "platforms_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy" (
    "device" VARCHAR(255),
    "status" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(255)
);

-- CreateTable
CREATE TABLE "potentials" (
    "id" SERIAL NOT NULL,
    "media_type" VARCHAR(255),
    "description" TEXT,
    "duration_type" VARCHAR(255),
    "campaign_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "duration" VARCHAR(255),
    "platform_id" INTEGER,
    "cost_per_view_campaign_id" INTEGER,
    "aff_campaign_id" INTEGER,
    "title" VARCHAR(255),

    CONSTRAINT "potentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "parent_id" INTEGER,
    "is_leaf" BOOLEAN
);

-- CreateTable
CREATE TABLE "product_counts" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "type" VARCHAR(255),

    CONSTRAINT "product_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_creator_content" (
    "id" SERIAL NOT NULL,
    "product_id" VARCHAR(255) NOT NULL,
    "creator_content_id" BIGINT NOT NULL,
    "product_name" VARCHAR(255),

    CONSTRAINT "product_creator_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_detail_reviews" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "product_rating" DECIMAL(2,1),
    "review_count" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "product_detail_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_statistics" (
    "id" SERIAL NOT NULL,
    "top_categories" JSONB,
    "gmv_range" JSONB,
    "top_ages" JSONB,
    "top_female_ratio" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "product_id" VARCHAR(255),

    CONSTRAINT "product_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "campaign_id" VARCHAR(255),
    "product_id" VARCHAR(255),
    "shop_name" VARCHAR(255),
    "effective_start_time" TIMESTAMPTZ(6),
    "effective_end_time" TIMESTAMPTZ(6),
    "creator_commission_rate" DECIMAL,
    "partner_commission_rate" DECIMAL,
    "link" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "referral_link" TEXT,
    "status" VARCHAR(255),
    "sold_count" INTEGER,
    "price" JSONB,
    "seller_id" INTEGER,
    "desc_detail" TEXT,
    "desc_video" JSONB,
    "images" TEXT[],
    "sale_props" JSONB,
    "logistic" JSONB,
    "specifications" JSONB,
    "category_id" INTEGER,
    "sample_quota" INTEGER,
    "category" TEXT,
    "root_category_id" INTEGER,
    "is_crawl" BOOLEAN DEFAULT false,
    "rating" DECIMAL,
    "review_count" SMALLINT,
    "revenue" DECIMAL,
    "creator_count" SMALLINT,
    "video_count" SMALLINT,
    "live_count" SMALLINT,
    "is_crawling" BOOLEAN DEFAULT false,
    "old_link" TEXT,
    "category_info" JSONB,
    "arr_link" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "user_ids" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "shop_code" VARCHAR(255),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_campaigns" (
    "id" SERIAL NOT NULL,
    "aff_campaign_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "products_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" BIGSERIAL NOT NULL,
    "dob" DATE,
    "province_code" VARCHAR,
    "district_code" VARCHAR,
    "ward_code" VARCHAR,
    "user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "address" VARCHAR(255),
    "identify_number" VARCHAR(255),
    "date_grant_identify" VARCHAR(255),
    "place_grant_identify" VARCHAR(255),
    "full_name" VARCHAR(255),
    "gender" VARCHAR(255),
    "date_expired_identify" VARCHAR(255),
    "email_contract" VARCHAR(255),
    "identify_number_front_image" VARCHAR(255),
    "identify_number_back_image" VARCHAR(255),
    "place_of_origin" VARCHAR(255),
    "place_of_residence" VARCHAR(255),
    "identity_card_full_name" VARCHAR(25),
    "next_updated_at" TIMESTAMPTZ(6),
    "addresses" JSONB,
    "tax_code" VARCHAR
);

-- CreateTable
CREATE TABLE "protest_overdues" (
    "id" SERIAL NOT NULL,
    "kol_submission_id" INTEGER,
    "status" VARCHAR(255),
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "description" TEXT,
    "aff_campaign_id" INTEGER,

    CONSTRAINT "protest_overdues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions_and_answers" (
    "id" BIGSERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "created_from" VARCHAR(255)
);

-- CreateTable
CREATE TABLE "referral_commissions" (
    "id" SERIAL NOT NULL,
    "referral_code" VARCHAR NOT NULL,
    "subordinates" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "referral_type" "referral_type" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "user_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_product_samples" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255),
    "address" TEXT,
    "phone_number" VARCHAR,
    "product_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "status" VARCHAR(255),
    "sku_id" INTEGER,
    "kol_submission_id" INTEGER,
    "kol_brand_tap_id" INTEGER,
    "draft_id" INTEGER,
    "reason" TEXT,
    "next_status" VARCHAR(255),
    "is_bd_confirm" BOOLEAN DEFAULT false,
    "tracking_number" TEXT,
    "is_updated_sku" BOOLEAN DEFAULT false,
    "is_bd_remind" BOOLEAN DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "note" TEXT,
    "delivery_service" VARCHAR(255),
    "reviewed_at" TIMESTAMPTZ(6),
    "tap_status" VARCHAR(255),
    "reminded_at" VARCHAR(255),
    "sku_sale_property_value_names" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "sku_id_tiktok" VARCHAR(255),

    CONSTRAINT "request_product_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_items" (
    "id" SERIAL NOT NULL,
    "review" JSONB DEFAULT '{}',
    "sku_id" VARCHAR(255),
    "sku_specification" VARCHAR(255),
    "review_user" JSONB DEFAULT '{}',
    "is_owner" BOOLEAN,
    "is_anonymous" BOOLEAN,
    "product_detail_review_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_applications" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sample_application_id" VARCHAR(255) NOT NULL,
    "approve_expiration_at" TIMESTAMPTZ(6),
    "available_quantity" INTEGER,
    "commission_rate" VARCHAR(50),
    "creator" JSONB NOT NULL DEFAULT '{}',
    "creator_username" VARCHAR(255),
    "creator_id" VARCHAR(255),
    "product" JSONB NOT NULL DEFAULT '{}',
    "is_approvable" BOOLEAN,
    "order_id" VARCHAR(255),
    "partner_name" VARCHAR(255),
    "status" VARCHAR(100),
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "kol_submission_id" INTEGER,
    "requested_at" TIMESTAMPTZ(6),
    "seller_id" VARCHAR(255),

    CONSTRAINT "sample_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_order_settings" (
    "id" SERIAL,
    "start_hour" SMALLINT NOT NULL,
    "end_hour" SMALLINT NOT NULL,
    "include_weekend" BOOLEAN DEFAULT true,
    "include_holiday" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" SERIAL NOT NULL,
    "seller_id" VARCHAR(255),
    "name" VARCHAR(255),
    "avatar_url" TEXT,
    "product_count" INTEGER,
    "seller_location" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "email_seller" VARCHAR(255),
    "shop_code" VARCHAR(255),

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_gmv_breakdown_daily" (
    "id" BIGSERIAL NOT NULL,
    "seller_id" VARCHAR(64) NOT NULL,
    "metric_date" DATE NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "gmv_amount" DECIMAL(30,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "shop_gmv_breakdown_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_performance_daily" (
    "id" SERIAL NOT NULL,
    "seller_id" VARCHAR(64) NOT NULL,
    "metric_date" DATE NOT NULL,
    "avg_customers_count" INTEGER,
    "items_sold" INTEGER,
    "orders_count" INTEGER,
    "sku_orders_count" INTEGER,
    "gmv_overall" DECIMAL(18,2),
    "gross_revenue" DECIMAL(18,2),
    "refunds_amount" DECIMAL(18,2),
    "avg_conversation_rate" DECIMAL(12,4),
    "avg_page_views" INTEGER,
    "avg_visitors" INTEGER,
    "currency" CHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "shop_performance_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_sync_states" (
    "user_id" VARCHAR(255) NOT NULL,
    "last_synced_at" TIMESTAMPTZ(6),
    "is_initial_sync_completed" BOOLEAN DEFAULT false,
    "status" VARCHAR(20) DEFAULT 'IDLE',
    "error_message" TEXT,
    "type" VARCHAR(100),
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "seller_id" VARCHAR(255)
);

-- CreateTable
CREATE TABLE "shopplus_tokens" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "brand_core_id" INTEGER,
    "user_id" INTEGER,
    "brand_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "shopplus_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku_transactions" (
    "id" SERIAL NOT NULL,
    "order_id" VARCHAR(255),
    "statement_id" VARCHAR(255),
    "sku_id" VARCHAR(255),
    "sku_name" VARCHAR(255),
    "product_name" TEXT,
    "quantity" INTEGER,
    "revenue_amount" DECIMAL(18,2),
    "settlement_amount" DECIMAL(18,2),
    "shipping_cost_amount" DECIMAL(18,2),
    "fee_tax_amount" DECIMAL(18,2),
    "fee_tax_breakdown" JSONB NOT NULL DEFAULT '{}',
    "revenue_breakdown" JSONB NOT NULL DEFAULT '{}',
    "shipping_cost_breakdown" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "sku_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skus" (
    "id" SERIAL NOT NULL,
    "sku_id" VARCHAR(255) NOT NULL,
    "sku_sale_props" JSONB NOT NULL DEFAULT '{}',
    "stock" INTEGER NOT NULL,
    "purchase_limit" INTEGER NOT NULL,
    "price" JSONB NOT NULL DEFAULT '{}',
    "promotion_view" JSONB NOT NULL DEFAULT '{}',
    "product_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "is_hidden" BOOLEAN DEFAULT false,
    "campaign_id" VARCHAR(255),

    CONSTRAINT "skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "billing_cycle" VARCHAR(20),
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "duration" VARCHAR(255),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok" (
    "id" SERIAL NOT NULL,
    "tiktok_id" VARCHAR(255),
    "refresh_token" VARCHAR(255),
    "user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "average_view_count" DECIMAL,
    "average_like_count" DECIMAL,
    "average_share_count" DECIMAL,
    "average_engagement_rate" DECIMAL,
    "video_count" DECIMAL,
    "likes_count" DECIMAL,
    "follower_count" DECIMAL,
    "following_count" DECIMAL,
    "link" TEXT,
    "refresh_token_creator_tap" VARCHAR(255),
    "video_gmv" DECIMAL,
    "live_gmv" DECIMAL,
    "female_ratio" DECIMAL,
    "open_id" TEXT,
    "total_gmv" DECIMAL,
    "avg_ec_live_uv" INTEGER,
    "avg_ec_video_view_count" INTEGER,
    "gmv_range" JSONB,
    "top_follower_demographics" JSONB,
    "category_ids" JSONB,
    "products_cart_gmv" DECIMAL,
    "follower_state_location" JSONB,
    "follower_ages" JSONB,
    "is_authorized" JSONB,
    "creator_oecu_id" VARCHAR(255),
    "is_fast_growing" BOOLEAN,
    "creator_id" VARCHAR(255),
    "follower_genders" JSONB,
    "posting_rate" DECIMAL,
    "is_unauthorized_showcase" BOOLEAN,
    "nearest_link" VARCHAR(255),
    "koc_cast" DECIMAL,

    CONSTRAINT "tiktok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok_analytics" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "tiktok_username" VARCHAR(255),
    "units_sold" DECIMAL,
    "gmv" DECIMAL,
    "follower" DECIMAL,
    "video_engagement_rate" DECIMAL,
    "ec_video_engagement_rate" DECIMAL,
    "video_play_cnt" DECIMAL,
    "ec_video_play_cnt" DECIMAL,
    "posting_rate" DECIMAL
);

-- CreateTable
CREATE TABLE "tiktok_cookies" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255),
    "value" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "value_arr" JSONB,
    "type" VARCHAR(255),
    "partner_id" VARCHAR(255)
);

-- CreateTable
CREATE TABLE "tiktok_external" (
    "id" SERIAL NOT NULL,
    "link" VARCHAR(255),
    "follower_count" DECIMAL,
    "video_gmv" DECIMAL,
    "live_gmv" DECIMAL,
    "female_ratio" DECIMAL,
    "total_gmv" DECIMAL,
    "avg_ec_live_uv" INTEGER,
    "avg_ec_video_view_count" INTEGER,
    "gmv_range" JSONB,
    "top_follower_demographics" JSONB,
    "category_ids" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "product_ids" JSONB,
    "referral_code" VARCHAR(255),
    "categories_tap" VARCHAR(255),

    CONSTRAINT "tiktok_external_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok_shop_authorizations" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "open_id" TEXT NOT NULL,
    "seller_name" VARCHAR(255),
    "seller_base_region" VARCHAR(10),
    "user_type" INTEGER,
    "access_token" TEXT NOT NULL,
    "access_token_expire_at" TIMESTAMPTZ(6) NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "refresh_token_expire_at" TIMESTAMPTZ(6) NOT NULL,
    "granted_scopes" JSONB,
    "is_authorized" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "seller_id" VARCHAR(255),

    CONSTRAINT "tiktok_shop_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_views" (
    "id" SERIAL NOT NULL,
    "draft_id" INTEGER,
    "video_id" TEXT,
    "view_count" DECIMAL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "tracking_view_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "amount" DECIMAL(10,2),
    "status" VARCHAR(255),
    "payment_gateway" VARCHAR(255),
    "metadata" JSONB,
    "kol_submission_id" INTEGER,
    "campaign_id" INTEGER,
    "payment_at" TIMESTAMPTZ(6)
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_categories" (
    "id" SERIAL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "user_categories_pk" PRIMARY KEY ("user_id","category_id")
);

-- CreateTable
CREATE TABLE "user_categories_tap" (
    "id" SERIAL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "user_categories_tap_pk" PRIMARY KEY ("user_id","category_id")
);

-- CreateTable
CREATE TABLE "user_galleries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(500),
    "user_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "type" VARCHAR(255),

    CONSTRAINT "user_galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interacts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "entity_id" INTEGER,
    "entity_name" VARCHAR(255),
    "interact_id" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "status" VARCHAR(255),
    "reason" VARCHAR(255),

    CONSTRAINT "user_interacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_watermarks" (
    "id" SERIAL NOT NULL,
    "last_read_notification_id" INTEGER,
    "entity_name" VARCHAR(255),
    "type" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "user_notification_watermarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_otp_sessions" (
    "id" SERIAL NOT NULL,
    "otp_type_id" INTEGER,
    "user_id" INTEGER,
    "code" VARCHAR(64),
    "expired_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "email" VARCHAR(255),
    "phone_number" VARCHAR(255),

    CONSTRAINT "user_otp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_platforms" (
    "id" SERIAL,
    "user_id" INTEGER NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "link" VARCHAR(255),

    CONSTRAINT "user_platforms_pkey" PRIMARY KEY ("user_id","platform_id")
);

-- CreateTable
CREATE TABLE "user_referrals" (
    "id" SERIAL NOT NULL,
    "child_user_id" INTEGER NOT NULL,
    "parent_user_id" INTEGER NOT NULL,
    "level_child" SMALLINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "user_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_relationships" (
    "id" SERIAL NOT NULL,
    "children_user_id" INTEGER NOT NULL,
    "parent_user_id" INTEGER,
    "scope" VARCHAR(255),

    CONSTRAINT "user_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "id" SERIAL NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "entity_name" VARCHAR(50) NOT NULL,
    "reason" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "status" VARCHAR DEFAULT 1,
    "description" TEXT,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expired_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT,
    "balance" DECIMAL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER
);

-- CreateTable
CREATE TABLE "wards" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255),
    "district_code" VARCHAR(255),

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube" (
    "id" SERIAL NOT NULL,
    "channel_id" VARCHAR(255),
    "refresh_token" VARCHAR(255),
    "user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "view_count" DECIMAL,
    "follower_count" DECIMAL,
    "video_count" DECIMAL,
    "link" VARCHAR,
    "data_analyst" JSONB,

    CONSTRAINT "youtube_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_pipeline_stages" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "mapped_status_code" TEXT NOT NULL,
    "is_terminal" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_pipeline_stages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_sources" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_sources_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_tiers" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "crm_tiers_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "crm_customer_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "source_code" TEXT NOT NULL,
    "tier_code" TEXT NOT NULL,
    "owner_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_pipeline_records" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "stage_code" TEXT NOT NULL,
    "owner_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_pipeline_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deals" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "pipeline_stage_code" TEXT NOT NULL,
    "owner_id" INTEGER,
    "product_package" TEXT NOT NULL,
    "deal_value" DECIMAL(14,2),
    "probability" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_pipeline_events" (
    "id" SERIAL NOT NULL,
    "event_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "payload" JSONB,
    "status" "CrmEventStatus" NOT NULL DEFAULT 'SUCCESS',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_pipeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255),
    "username" VARCHAR(255),
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "is_verify_email" BOOLEAN,
    "password" TEXT,
    "avatar_name" TEXT,
    "background_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "role_id" INTEGER,
    "bio" TEXT,
    "total_spent" DECIMAL(10,2),
    "rating" DECIMAL(10,2),
    "age" VARCHAR(255),
    "platform_id" INTEGER,
    "profile_id" INTEGER,
    "contract_id" INTEGER,
    "tiktok_id" INTEGER,
    "notification_token" VARCHAR,
    "gender" VARCHAR(255),
    "is_block" BOOLEAN DEFAULT false,
    "apple_id" VARCHAR(255),
    "youtube_id" INTEGER,
    "phone_number" VARCHAR(255),
    "is_new_user" BOOLEAN DEFAULT true,
    "is_auth_creator_tap" BOOLEAN DEFAULT false,
    "is_restricted" BOOLEAN DEFAULT false,
    "have_showcase" BOOLEAN DEFAULT false,
    "categories_tap" TEXT,
    "last_active_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "channel_orientation" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "is_koc_core" BOOLEAN DEFAULT false,
    "is_pinned" BOOLEAN DEFAULT false,
    "is_created_external" BOOLEAN DEFAULT false,
    "metadata" JSONB,
    "is_active_ai" BOOLEAN,
    "is_high_gmv" BOOLEAN DEFAULT false,
    "brand_name" VARCHAR(255),
    "parent_id" INTEGER,
    "is_phone_verified" BOOLEAN,
    "is_show_page_identity" BOOLEAN DEFAULT false,
    "shop_codes" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "is_active" BOOLEAN DEFAULT true,
    "current_parent_user_id" SMALLINT,
    "blocked_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(512),
    "type" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "type" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" INTEGER,
    "scope" VARCHAR(255),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_roles" (
    "id" SERIAL NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "permission_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "address_pkey" ON "address"("id");

-- CreateIndex
CREATE INDEX "idx_admin_inbox_created_at" ON "admin_notification_inbox"("created_at");

-- CreateIndex
CREATE INDEX "idx_admin_inbox_related_user" ON "admin_notification_inbox"("related_user_id");

-- CreateIndex
CREATE INDEX "idx_admin_inbox_source_type" ON "admin_notification_inbox"("source_type");

-- CreateIndex
CREATE INDEX "idx_brand_taps_tag_name" ON "brand_taps"("tag_name");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_pkey" ON "contacts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_content_unique" ON "creator_content"("content_id");

-- CreateIndex
CREATE INDEX "creator_content_content_id_idx" ON "creator_content"("content_id", "product_id", "seller_id");

-- CreateIndex
CREATE INDEX "creator_content_content_type_idx" ON "creator_content"("content_type");

-- CreateIndex
CREATE INDEX "creator_content_creator_username_idx" ON "creator_content"("creator_username");

-- CreateIndex
CREATE INDEX "creator_content_published_at_idx" ON "creator_content"("published_at");

-- CreateIndex
CREATE INDEX "creator_content_seller_id_idx" ON "creator_content"("seller_id");

-- CreateIndex
CREATE INDEX "idx_creator_content_content_id" ON "creator_content"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profile_snapshot_creator_username_key" ON "creator_profile_snapshot"("creator_username");

-- CreateIndex
CREATE INDEX "creator_profile_cache_creator_id_idx" ON "creator_profile_snapshot"("creator_id");

-- CreateIndex
CREATE INDEX "creator_profile_cache_creator_username_idx" ON "creator_profile_snapshot"("creator_username");

-- CreateIndex
CREATE INDEX "drafts_kol_submission_id_idx" ON "drafts"("kol_submission_id");

-- CreateIndex
CREATE INDEX "drafts_request_product_sample_id_idx" ON "drafts"("request_product_sample_id");

-- CreateIndex
CREATE UNIQUE INDEX "features_code_unique" ON "features"("code");

-- CreateIndex
CREATE INDEX "idx_file_imports_file_id" ON "file_imports"("file_id");

-- CreateIndex
CREATE INDEX "idx_file_imports_user_id" ON "file_imports"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_holiday" ON "holidays"("date", "country_code");

-- CreateIndex
CREATE INDEX "idx_node_paths_descendant" ON "node_paths"("descendant_id");

-- CreateIndex
CREATE INDEX "idx_nodes_user_parent" ON "nodes"("user_id", "parent_id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_nodes_user_status" ON "nodes"("user_id", "status") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "notification_campaigns_type_index" ON "notification_campaigns" USING HASH ("type");

-- CreateIndex
CREATE INDEX "notification_filter_idx" ON "notifications"("created_by", "is_read", "created_at", "receiver_id");

-- CreateIndex
CREATE INDEX "notifications_type_index" ON "notifications" USING HASH ("type");

-- CreateIndex
CREATE UNIQUE INDEX "idx_order_creator_content_order_id" ON "order_creator_content"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_creator_content_unique" ON "order_creator_content"("order_id", "creator_content_id");

-- CreateIndex
CREATE INDEX "order_line_items_order_id_idx" ON "order_line_items"("order_id");

-- CreateIndex
CREATE INDEX "order_line_items_package_id_idx" ON "order_line_items"("package_id");

-- CreateIndex
CREATE INDEX "order_line_items_product_id_idx" ON "order_line_items"("product_id");

-- CreateIndex
CREATE INDEX "order_line_items_sku_id_idx" ON "order_line_items"("sku_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_order_line_items_order_id_line_item_id" ON "order_line_items"("order_id", "order_line_item_id");

-- CreateIndex
CREATE INDEX "order_packages_order_id_idx" ON "order_packages"("order_id");

-- CreateIndex
CREATE INDEX "order_packages_package_id_idx" ON "order_packages"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_order_packages_order_id_package_id" ON "order_packages"("order_id", "package_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_payments_order_id_key" ON "order_payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_recipients_order_id_key" ON "order_recipients"("order_id");

-- CreateIndex
CREATE INDEX "idx_order_skus_order_id_content" ON "order_skus"("order_id", "content_id");

-- CreateIndex
CREATE INDEX "order_skus_content_id_idx" ON "order_skus"("content_id");

-- CreateIndex
CREATE INDEX "order_skus_creator_username_idx" ON "order_skus"("creator_username");

-- CreateIndex
CREATE INDEX "order_skus_order_id_idx" ON "order_skus"("order_id");

-- CreateIndex
CREATE INDEX "order_skus_price_gin_idx" ON "order_skus" USING GIN ("price");

-- CreateIndex
CREATE INDEX "order_skus_product_id_idx" ON "order_skus"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_order_skus_order_product" ON "order_skus"("order_id", "product_id") WHERE (product_id IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "order_transactions_unique" ON "order_transactions"("order_id");

-- CreateIndex
CREATE INDEX "order_transactions_order_id_idx" ON "order_transactions"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_orders_order_id" ON "orders"("order_id");

-- CreateIndex
CREATE INDEX "idx_orders_affiliate_creator_buyer" ON "orders"("buyer_user_id");

-- CreateIndex
CREATE INDEX "idx_orders_affiliate_creator_time" ON "orders"("source", "creator_username", "create_time");

-- CreateIndex
CREATE INDEX "idx_orders_source" ON "orders"("source") WHERE ((source)::text = 'AFFILIATE'::text);

-- CreateIndex
CREATE INDEX "orders_create_time_idx" ON "orders"("create_time");

-- CreateIndex
CREATE INDEX "orders_order_type_idx" ON "orders"("order_type");

-- CreateIndex
CREATE INDEX "orders_paid_time_idx" ON "orders"("paid_time");

-- CreateIndex
CREATE INDEX "orders_shipping_provider_idx" ON "orders"("shipping_provider_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tap_seq_id_unique" ON "orders_tap"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_users_unique" ON "permission_users"("permission_id", "user_relationship_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_unique" ON "plan_features"("plan_id", "feature_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_creator_content_un" ON "product_creator_content"("product_id", "creator_content_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_unique" ON "products"("campaign_id", "product_id", "link", "shop_code");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_pkey" ON "profiles"("id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_and_answers_pkey" ON "questions_and_answers"("id");

-- CreateIndex
CREATE INDEX "request_product_samples_kol_brand_tap_id_idx" ON "request_product_samples"("kol_brand_tap_id");

-- CreateIndex
CREATE INDEX "request_product_samples_kol_submission_id_idx" ON "request_product_samples"("kol_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "sample_applications_unique_1" ON "sample_applications"("sample_application_id");

-- CreateIndex
CREATE UNIQUE INDEX "sample_applications_unique" ON "sample_applications"("order_id");

-- CreateIndex
CREATE INDEX "sample_applications_creator_username_idx" ON "sample_applications"("creator_username");

-- CreateIndex
CREATE INDEX "sample_applications_order_id_idx" ON "sample_applications"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_id_unique" ON "sellers"("seller_id");

-- CreateIndex
CREATE INDEX "shop_gmv_breakdown_daily_shop_date_idx" ON "shop_gmv_breakdown_daily"("seller_id", "metric_date");

-- CreateIndex
CREATE INDEX "shop_gmv_breakdown_daily_type_idx" ON "shop_gmv_breakdown_daily"("type");

-- CreateIndex
CREATE UNIQUE INDEX "shop_gmv_breakdown_daily_unique" ON "shop_gmv_breakdown_daily"("seller_id", "metric_date", "type");

-- CreateIndex
CREATE INDEX "shop_performance_daily_metric_date_idx" ON "shop_performance_daily"("metric_date");

-- CreateIndex
CREATE INDEX "shop_performance_daily_shop_date_idx" ON "shop_performance_daily"("seller_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "shop_performance_daily_unique" ON "shop_performance_daily"("seller_id", "metric_date");

-- CreateIndex
CREATE INDEX "sku_transactions_order_id_idx" ON "sku_transactions"("order_id");

-- CreateIndex
CREATE INDEX "sku_transactions_sku_id_idx" ON "sku_transactions"("sku_id");

-- CreateIndex
CREATE INDEX "sku_transactions_statement_id_idx" ON "sku_transactions"("statement_id");

-- CreateIndex
CREATE INDEX "skus_product_id_idx" ON "skus"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "tiktok_creator_id_unique" ON "tiktok"("creator_id");

-- CreateIndex
CREATE INDEX "idx_koc_cast_concurrently" ON "tiktok"("koc_cast");

-- CreateIndex
CREATE INDEX "tiktok_link_idx" ON "tiktok"("link");

-- CreateIndex
CREATE INDEX "tiktok_user_id_idx" ON "tiktok"("user_id");

-- CreateIndex
CREATE INDEX "tiktok_analytics_tiktok_username_idx" ON "tiktok_analytics"("tiktok_username");

-- CreateIndex
CREATE INDEX "tiktok_shop_authorizations_user_id_idx" ON "tiktok_shop_authorizations"("created_by");

-- CreateIndex
CREATE INDEX "user_activities_created_by_idx" ON "user_activities"("created_by");

-- CreateIndex
CREATE INDEX "user_referrals_level_child_idx" ON "user_referrals"("level_child" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_relationships_unique" ON "user_relationships"("children_user_id", "parent_user_id", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "created_by_unique" ON "wallets"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "crm_customer_profiles_user_id_key" ON "crm_customer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_pipeline_records_deal_id_key" ON "crm_pipeline_records"("deal_id");

-- CreateIndex
CREATE INDEX "crm_pipeline_records_stage_code_idx" ON "crm_pipeline_records"("stage_code");

-- CreateIndex
CREATE UNIQUE INDEX "crm_deals_customer_id_key" ON "crm_deals"("customer_id");

-- CreateIndex
CREATE INDEX "crm_deals_pipeline_stage_code_idx" ON "crm_deals"("pipeline_stage_code");

-- CreateIndex
CREATE UNIQUE INDEX "crm_pipeline_events_event_key_key" ON "crm_pipeline_events"("event_key");

-- CreateIndex
CREATE INDEX "crm_pipeline_events_entity_type_entity_id_idx" ON "crm_pipeline_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "crm_pipeline_events_event_type_idx" ON "crm_pipeline_events"("event_type");

-- CreateIndex
CREATE INDEX "crm_pipeline_events_status_idx" ON "crm_pipeline_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "permission_roles_un" ON "permission_roles"("permission_id", "role_id");

-- AddForeignKey
ALTER TABLE "admin_notification_inbox" ADD CONSTRAINT "fk_admin_inbox_notification" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "admin_notification_inbox" ADD CONSTRAINT "fk_admin_inbox_notification_custom" FOREIGN KEY ("notification_custom_id") REFERENCES "notification_customs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aff_campaigns" ADD CONSTRAINT "fk_aff_campaigns_referral" FOREIGN KEY ("referral_id") REFERENCES "referral_commissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "brands_info" ADD CONSTRAINT "brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_imports" ADD CONSTRAINT "file_imports_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "file_imports" ADD CONSTRAINT "file_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kol_pricing" ADD CONSTRAINT "kol_pricing_fk" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kol_submissions" ADD CONSTRAINT "kol_submissions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "node_paths" ADD CONSTRAINT "node_paths_ancestor_id_fkey" FOREIGN KEY ("ancestor_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "node_paths" ADD CONSTRAINT "node_paths_descendant_id_fkey" FOREIGN KEY ("descendant_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_fk" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "platforms_campaigns" ADD CONSTRAINT "platforms_campaigns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "platforms_campaigns" ADD CONSTRAINT "platforms_campaigns_fk" FOREIGN KEY ("potential_id") REFERENCES "potentials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "platforms_campaigns" ADD CONSTRAINT "platforms_campaigns_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_interacts" ADD CONSTRAINT "user_interacts_interact_id_fkey" FOREIGN KEY ("interact_id") REFERENCES "interacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interacts" ADD CONSTRAINT "user_interacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_otp_sessions" ADD CONSTRAINT "user_otp_sessions_otp_type_id_fkey" FOREIGN KEY ("otp_type_id") REFERENCES "otp_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_otp_sessions" ADD CONSTRAINT "user_otp_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_customer_profiles" ADD CONSTRAINT "crm_customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_customer_profiles" ADD CONSTRAINT "crm_customer_profiles_source_code_fkey" FOREIGN KEY ("source_code") REFERENCES "crm_sources"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_customer_profiles" ADD CONSTRAINT "crm_customer_profiles_tier_code_fkey" FOREIGN KEY ("tier_code") REFERENCES "crm_tiers"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_customer_profiles" ADD CONSTRAINT "crm_customer_profiles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_pipeline_records" ADD CONSTRAINT "crm_pipeline_records_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_pipeline_records" ADD CONSTRAINT "crm_pipeline_records_stage_code_fkey" FOREIGN KEY ("stage_code") REFERENCES "crm_pipeline_stages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_pipeline_records" ADD CONSTRAINT "crm_pipeline_records_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "crm_customer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_pipeline_stage_code_fkey" FOREIGN KEY ("pipeline_stage_code") REFERENCES "crm_pipeline_stages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_roles" ADD CONSTRAINT "permission_roles_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_roles" ADD CONSTRAINT "permission_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
