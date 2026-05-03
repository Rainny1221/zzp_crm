-- Rework CRM notifications to one row per receiver so read state is local to
-- the notification row.

-- Preserve old read rows as per-receiver notifications where possible. Old
-- notifications without a receiver cannot be mapped to the new model.
ALTER TABLE "crm_notifications"
  RENAME COLUMN "description" TO "message";

ALTER TABLE "crm_notifications"
  ADD COLUMN "receiver_user_id" INTEGER,
  ADD COLUMN "deal_id" INTEGER,
  ADD COLUMN "actor_user_id" INTEGER,
  ADD COLUMN "payload" JSONB,
  ADD COLUMN "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "read_at" TIMESTAMPTZ(6);

UPDATE "crm_notifications" n
SET
  "receiver_user_id" = nr."user_id",
  "is_read" = TRUE,
  "read_at" = nr."read_at"
FROM (
  SELECT DISTINCT ON ("notification_id")
    "notification_id",
    "user_id",
    "read_at"
  FROM "crm_notification_reads"
  ORDER BY "notification_id", "read_at" DESC
) nr
WHERE nr."notification_id" = n."id";

DROP TABLE "crm_notification_reads";

INSERT INTO "crm_notification_types" ("code", "label", "sort_order", "is_active")
VALUES
  ('customer_created', 'Customer created', 1, TRUE),
  ('assignment_changed', 'Assignment changed', 2, TRUE),
  ('interaction_logged', 'Interaction logged', 3, TRUE),
  ('pipeline_stage_changed', 'Pipeline stage changed', 4, TRUE),
  ('product_package_changed', 'Product package changed', 5, TRUE)
ON CONFLICT ("code") DO UPDATE
SET
  "label" = EXCLUDED."label",
  "sort_order" = EXCLUDED."sort_order",
  "is_active" = EXCLUDED."is_active";

DELETE FROM "crm_notifications"
WHERE "receiver_user_id" IS NULL
   OR "type_code" NOT IN (
    'customer_created',
    'assignment_changed',
    'interaction_logged',
    'pipeline_stage_changed',
    'product_package_changed'
  );

ALTER TABLE "crm_notifications"
  ALTER COLUMN "receiver_user_id" SET NOT NULL;

DROP INDEX IF EXISTS "crm_notifications_type_code_idx";
DROP INDEX IF EXISTS "crm_notifications_created_at_idx";

CREATE INDEX "crm_notifications_receiver_user_id_is_read_created_at_idx"
  ON "crm_notifications" ("receiver_user_id", "is_read", "created_at");

CREATE INDEX "crm_notifications_type_code_created_at_idx"
  ON "crm_notifications" ("type_code", "created_at");

CREATE INDEX "crm_notifications_deal_id_idx"
  ON "crm_notifications" ("deal_id");

ALTER TABLE "crm_notifications"
  ADD CONSTRAINT "crm_notifications_type_code_fkey"
  FOREIGN KEY ("type_code")
  REFERENCES "crm_notification_types"("code")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "crm_notifications"
  ADD CONSTRAINT "crm_notifications_receiver_user_id_fkey"
  FOREIGN KEY ("receiver_user_id")
  REFERENCES "users"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "crm_notifications"
  ADD CONSTRAINT "crm_notifications_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "crm_notifications"
  ADD CONSTRAINT "crm_notifications_customer_id_fkey"
  FOREIGN KEY ("customer_id")
  REFERENCES "crm_customer_profiles"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "crm_notifications"
  ADD CONSTRAINT "crm_notifications_deal_id_fkey"
  FOREIGN KEY ("deal_id")
  REFERENCES "crm_deals"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

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
    ('CRM_NOTIFICATION_VIEW'),
    ('CRM_NOTIFICATION_MANAGE')
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
WHERE p."name" IN ('CRM_NOTIFICATION_VIEW', 'CRM_NOTIFICATION_MANAGE')
  AND p."deleted_at" IS NULL
  AND r."deleted_at" IS NULL
ON CONFLICT ("permission_id", "role_id") DO NOTHING;
