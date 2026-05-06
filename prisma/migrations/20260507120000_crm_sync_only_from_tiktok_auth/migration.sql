/*
  MANUAL-REVIEWED MIGRATION
  CRM sync only after TikTok shop authorization:
  - Remove enqueue on users INSERT (seller CRM starts at auth, not signup).
  - TikTok triggers only enqueue when linked user is CRM-eligible (role_id = 6, active, not blocked, not deleted).
*/

-- =========================================================
-- STEP 1: Stop CRM sync enqueue from users
-- =========================================================

DROP TRIGGER IF EXISTS trg_users_enqueue_crm_sync ON users;

CREATE OR REPLACE FUNCTION crm_enqueue_user_created()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Intentionally no crm_sync_jobs enqueue: CRM seller sync is driven by tiktok_shop_authorizations only.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- STEP 2: Shared guard — eligible CRM seller user (role 6)
-- =========================================================

CREATE OR REPLACE FUNCTION crm_user_is_crm_eligible_seller(p_user_id INT)
    RETURNS BOOLEAN AS
$$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (SELECT 1
                   FROM users u
                   WHERE u.id = p_user_id
                     AND u.role_id = 6
                     AND u.deleted_at IS NULL
                     AND (u.is_active IS DISTINCT FROM FALSE)
                     AND (u.is_block IS DISTINCT FROM TRUE));
END;
$$ LANGUAGE plpgsql STABLE;

-- =========================================================
-- STEP 3: TikTok INSERT — enqueue only for eligible sellers
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

    IF NOT crm_user_is_crm_eligible_seller(v_user_id) THEN
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
-- STEP 4: TikTok UPDATE — same guard + re-queue
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

    IF NOT crm_user_is_crm_eligible_seller(v_user_id) THEN
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
