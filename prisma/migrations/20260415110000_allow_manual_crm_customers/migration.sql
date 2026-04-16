-- Allow CRM customers to be created independently from application users.
ALTER TABLE "crm_customer_profiles"
  ALTER COLUMN "user_id" DROP NOT NULL;

-- Manual CRM leads may start with only one contact channel.
ALTER TABLE "crm_customer_business_profiles"
  ALTER COLUMN "shop_name" DROP NOT NULL,
  ALTER COLUMN "phone" DROP NOT NULL,
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "gmv_monthly" DROP DEFAULT,
  ALTER COLUMN "gmv_monthly" DROP NOT NULL;

-- Expose a dedicated create permission for CRM customer creation.
INSERT INTO "permissions" (
  "name",
  "type",
  "is_active",
  "created_at",
  "updated_at",
  "scope"
)
SELECT
  'CRM_CUSTOMER_CREATE',
  'CRM',
  TRUE,
  now(),
  now(),
  'GLOBAL'
WHERE NOT EXISTS (
  SELECT 1
  FROM "permissions"
  WHERE "name" = 'CRM_CUSTOMER_CREATE'
    AND "deleted_at" IS NULL
);
