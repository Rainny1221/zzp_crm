/*
  MANUAL-REVIEWED MIGRATION
  CRM seller sync: authorize snapshot on crm_customer_profiles, gate enqueue on role_id = 6,
  enqueue when tiktok_shop_authorizations changes.
  Note: production TikTok shop auth lives in tiktok_shop_authorizations (created_by → users.id).
*/

-- =========================================================
-- STEP 1: Authorize snapshot on CRM customer profile
-- =========================================================

ALTER TABLE "crm_customer_profiles"
    ADD COLUMN IF NOT EXISTS "is_authorized" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "crm_customer_profiles"
    ADD COLUMN IF NOT EXISTS "authorized_at" TIMESTAMPTZ(6);

-- =========================================================
-- STEP 2: Gate users INSERT enqueue — CRM eligible role id = 6
-- Superseded for new installs by migration 20260507120000_crm_sync_only_from_tiktok_auth
-- (no enqueue from users; TikTok-only + DB guard on tiktok triggers).
-- =========================================================

CREATE OR REPLACE FUNCTION crm_enqueue_user_created()
    RETURNS TRIGGER AS
$$
DECLARE
    v_event_key TEXT;
BEGIN
    IF NEW.role_id IS DISTINCT FROM 6 THEN
        RETURN NEW;
    END IF;

    v_event_key := 'USER_CREATED:' || NEW.id::TEXT;

    INSERT INTO crm_sync_jobs (event_key,
                               event_type,
                               user_id,
                               payload,
                               status,
                               retry_count,
                               created_at,
                               updated_at)
    VALUES (v_event_key,
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
            NOW())
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

EXCEPTION
    WHEN OTHERS THEN
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

-- =========================================================
-- STEP 3: TikTok shop authorization INSERT → enqueue
-- =========================================================

CREATE OR REPLACE FUNCTION crm_enqueue_after_tiktok_shop_authorization_insert()
    RETURNS TRIGGER AS
$$
DECLARE
    v_user_id   INT;
    v_event_key TEXT;
BEGIN
    v_user_id := NEW.created_by;
    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    v_event_key := 'TIKTOK_AUTH_CREATED:' || v_user_id::TEXT || ':' || NEW.id::TEXT;

    INSERT INTO crm_sync_jobs (event_key,
                               event_type,
                               user_id,
                               payload,
                               status,
                               retry_count,
                               created_at,
                               updated_at)
    VALUES (v_event_key,
            'TIKTOK_AUTH_CREATED',
            v_user_id,
            jsonb_build_object(
                    'user_id', v_user_id,
                    'authorization_id', NEW.id,
                    'source_table', 'tiktok_shop_authorizations'
            ),
            'PENDING',
            0,
            NOW(),
            NOW())
    ON CONFLICT (event_key) DO NOTHING;

    PERFORM crm_log_event(
            'ENQUEUE_CRM_SYNC_JOB',
            'tiktok_shop_authorizations',
            NEW.id,
            jsonb_build_object(
                    'event_key', v_event_key,
                    'user_id', v_user_id
            ),
            'SUCCESS',
            NULL
         );

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        PERFORM crm_log_event(
                'ENQUEUE_CRM_SYNC_JOB',
                'tiktok_shop_authorizations',
                NEW.id,
                jsonb_build_object(
                        'event_key', v_event_key,
                        'user_id', v_user_id
                ),
                'FAILED',
                SQLERRM
                 );
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- STEP 4: TikTok shop authorization UPDATE → re-queue same logical key
-- =========================================================

CREATE OR REPLACE FUNCTION crm_enqueue_after_tiktok_shop_authorization_update()
    RETURNS TRIGGER AS
$$
DECLARE
    v_user_id   INT;
    v_event_key TEXT;
BEGIN
    v_user_id := NEW.created_by;
    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    v_event_key := 'TIKTOK_AUTH_UPDATED:' || v_user_id::TEXT || ':' || NEW.id::TEXT;

    INSERT INTO crm_sync_jobs (event_key,
                               event_type,
                               user_id,
                               payload,
                               status,
                               retry_count,
                               created_at,
                               updated_at)
    VALUES (v_event_key,
            'TIKTOK_AUTH_UPDATED',
            v_user_id,
            jsonb_build_object(
                    'user_id', v_user_id,
                    'authorization_id', NEW.id,
                    'source_table', 'tiktok_shop_authorizations'
            ),
            'PENDING',
            0,
            NOW(),
            NOW())
    ON CONFLICT (event_key) DO UPDATE
        SET status       = 'PENDING'::"CrmSyncJobStatus",
            payload      = EXCLUDED.payload,
            updated_at   = NOW(),
            last_error   = NULL,
            processed_at = NULL,
            locked_at    = NULL;

    PERFORM crm_log_event(
            'ENQUEUE_CRM_SYNC_JOB',
            'tiktok_shop_authorizations',
            NEW.id,
            jsonb_build_object(
                    'event_key', v_event_key,
                    'user_id', v_user_id
            ),
            'SUCCESS',
            NULL
         );

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        PERFORM crm_log_event(
                'ENQUEUE_CRM_SYNC_JOB',
                'tiktok_shop_authorizations',
                NEW.id,
                jsonb_build_object(
                        'event_key', v_event_key,
                        'user_id', v_user_id
                ),
                'FAILED',
                SQLERRM
                 );
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tiktok_shop_authorizations_enqueue_crm_sync_insert ON tiktok_shop_authorizations;

CREATE TRIGGER trg_tiktok_shop_authorizations_enqueue_crm_sync_insert
    AFTER INSERT
    ON tiktok_shop_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION crm_enqueue_after_tiktok_shop_authorization_insert();

DROP TRIGGER IF EXISTS trg_tiktok_shop_authorizations_enqueue_crm_sync_update ON tiktok_shop_authorizations;

CREATE TRIGGER trg_tiktok_shop_authorizations_enqueue_crm_sync_update
    AFTER UPDATE
    ON tiktok_shop_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION crm_enqueue_after_tiktok_shop_authorization_update();
