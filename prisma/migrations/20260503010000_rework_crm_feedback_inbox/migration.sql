INSERT INTO crm_feedback_categories (code, label, sort_order, is_active)
VALUES
  ('failure', 'Failure', 1, TRUE),
  ('feature', 'Feature', 2, TRUE),
  ('price', 'Price', 3, TRUE),
  ('support', 'Support', 4, TRUE),
  ('other', 'Other', 5, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

DO $$
BEGIN
  IF to_regclass('public.crm_feedbacks') IS NOT NULL THEN
    INSERT INTO crm_feedback_categories (code, label, sort_order, is_active)
    SELECT DISTINCT
      f.category_code,
      INITCAP(REPLACE(f.category_code, '_', ' ')),
      100,
      TRUE
    FROM crm_feedbacks f
    WHERE f.category_code IS NOT NULL
    ON CONFLICT (code) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_feedback') IS NULL
    AND to_regclass('public.crm_feedbacks') IS NOT NULL
  THEN
    ALTER TABLE crm_feedbacks RENAME TO crm_feedback;
  END IF;

  IF to_regclass('public.crm_feedback') IS NULL THEN
    CREATE TABLE crm_feedback (
      id SERIAL PRIMARY KEY,
      category_code TEXT NOT NULL,
      customer_id INTEGER,
      deal_id INTEGER,
      actor_user_id INTEGER,
      receiver_user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      payload JSONB,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      read_at TIMESTAMPTZ(6),
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'crm_feedback'
      AND column_name = 'content'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'crm_feedback'
      AND column_name = 'message'
  ) THEN
    ALTER TABLE crm_feedback RENAME COLUMN content TO message;
  END IF;
END $$;

ALTER TABLE crm_feedback ADD COLUMN IF NOT EXISTS deal_id INTEGER;
ALTER TABLE crm_feedback ADD COLUMN IF NOT EXISTS actor_user_id INTEGER;
ALTER TABLE crm_feedback ADD COLUMN IF NOT EXISTS receiver_user_id INTEGER;
ALTER TABLE crm_feedback ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE crm_feedback ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE crm_feedback ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE crm_feedback ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ(6);

UPDATE crm_feedback
SET title = COALESCE(title, 'Customer feedback');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'crm_feedback'
      AND column_name = 'sales_user_id'
  ) THEN
    UPDATE crm_feedback
    SET
      actor_user_id = COALESCE(actor_user_id, sales_user_id),
      receiver_user_id = COALESCE(receiver_user_id, sales_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_feedback_reads') IS NOT NULL THEN
    UPDATE crm_feedback f
    SET
      is_read = TRUE,
      read_at = r.read_at
    FROM crm_feedback_reads r
    WHERE r.feedback_id = f.id
      AND r.user_id = f.receiver_user_id;
  END IF;
END $$;

UPDATE crm_feedback f
SET customer_id = NULL
WHERE customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM crm_customer_profiles c
    WHERE c.id = f.customer_id
  );

UPDATE crm_feedback f
SET actor_user_id = NULL
WHERE actor_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = f.actor_user_id
  );

UPDATE crm_feedback f
SET receiver_user_id = NULL
WHERE receiver_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = f.receiver_user_id
  );

ALTER TABLE crm_feedback ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE crm_feedback ALTER COLUMN title SET NOT NULL;

ALTER TABLE crm_feedback DROP COLUMN IF EXISTS sales_user_id;
ALTER TABLE crm_feedback DROP COLUMN IF EXISTS sales_name;

DROP TABLE IF EXISTS crm_feedback_reads;

DROP INDEX IF EXISTS crm_feedbacks_customer_id_idx;
DROP INDEX IF EXISTS crm_feedbacks_category_code_idx;
DROP INDEX IF EXISTS crm_feedbacks_sales_user_id_idx;
DROP INDEX IF EXISTS crm_feedbacks_created_at_idx;

CREATE INDEX IF NOT EXISTS crm_feedback_receiver_user_id_is_read_created_at_idx
  ON crm_feedback(receiver_user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS crm_feedback_category_code_created_at_idx
  ON crm_feedback(category_code, created_at);
CREATE INDEX IF NOT EXISTS crm_feedback_customer_id_idx
  ON crm_feedback(customer_id);
CREATE INDEX IF NOT EXISTS crm_feedback_deal_id_idx
  ON crm_feedback(deal_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_feedback_category_code_fkey'
  ) THEN
    ALTER TABLE crm_feedback
      ADD CONSTRAINT crm_feedback_category_code_fkey
      FOREIGN KEY (category_code)
      REFERENCES crm_feedback_categories(code)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_feedback_customer_id_fkey'
  ) THEN
    ALTER TABLE crm_feedback
      ADD CONSTRAINT crm_feedback_customer_id_fkey
      FOREIGN KEY (customer_id)
      REFERENCES crm_customer_profiles(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_feedback_deal_id_fkey'
  ) THEN
    ALTER TABLE crm_feedback
      ADD CONSTRAINT crm_feedback_deal_id_fkey
      FOREIGN KEY (deal_id)
      REFERENCES crm_deals(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_feedback_actor_user_id_fkey'
  ) THEN
    ALTER TABLE crm_feedback
      ADD CONSTRAINT crm_feedback_actor_user_id_fkey
      FOREIGN KEY (actor_user_id)
      REFERENCES users(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_feedback_receiver_user_id_fkey'
  ) THEN
    ALTER TABLE crm_feedback
      ADD CONSTRAINT crm_feedback_receiver_user_id_fkey
      FOREIGN KEY (receiver_user_id)
      REFERENCES users(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

INSERT INTO "permissions" (
  "name",
  "type",
  "is_active",
  "created_at",
  "updated_at",
  "scope"
)
SELECT
  permission."name",
  'CRM',
  TRUE,
  now(),
  now(),
  'GLOBAL'
FROM (
  VALUES
    ('CRM_FEEDBACK_VIEW'),
    ('CRM_FEEDBACK_MANAGE')
) AS permission("name")
WHERE NOT EXISTS (
  SELECT 1
  FROM "permissions" existing
  WHERE existing."name" = permission."name"
    AND existing."deleted_at" IS NULL
);

INSERT INTO "permission_roles" ("permission_id", "role_id")
SELECT p."id", r."id"
FROM "permissions" p
JOIN "roles" r ON r."name" IN ('ADMIN', 'SALE_MANAGER', 'SALE')
WHERE p."name" IN ('CRM_FEEDBACK_VIEW', 'CRM_FEEDBACK_MANAGE')
  AND p."deleted_at" IS NULL
  AND r."deleted_at" IS NULL
ON CONFLICT ("permission_id", "role_id") DO NOTHING;
