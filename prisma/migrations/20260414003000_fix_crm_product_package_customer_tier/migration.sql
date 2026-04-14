-- Separate product package from customer tier/segment.
-- 399/699/trial are product packages; tiny/potential/whale are customer tiers.

CREATE TABLE IF NOT EXISTS "crm_product_packages" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "crm_product_packages_pkey" PRIMARY KEY ("code")
);

ALTER TABLE "crm_product_packages"
    ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "crm_product_packages"
    ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "crm_product_packages_sort_order_idx"
    ON "crm_product_packages"("sort_order");

INSERT INTO "crm_product_packages" ("code", "label", "sort_order", "is_active")
VALUES
    ('trial', 'Trial', 1, true),
    ('399', 'Gói 399k', 2, true),
    ('699', 'Gói 699k', 3, true)
ON CONFLICT ("code") DO UPDATE SET
    "label" = EXCLUDED."label",
    "sort_order" = EXCLUDED."sort_order",
    "is_active" = EXCLUDED."is_active";

ALTER TABLE "crm_customer_profiles"
    DROP CONSTRAINT IF EXISTS "crm_customer_profiles_tier_code_fkey";

ALTER TABLE "crm_customer_profiles"
    ALTER COLUMN "tier_code" DROP NOT NULL;

ALTER TABLE "crm_customer_profiles"
    ADD COLUMN IF NOT EXISTS "gmv_monthly" NUMERIC(18, 2);

ALTER TABLE "crm_customer_profiles"
    ADD COLUMN IF NOT EXISTS "customer_tier_code" TEXT;

UPDATE "crm_customer_profiles"
SET "customer_tier_code" = "tier_code"
WHERE "customer_tier_code" IS NULL
  AND "tier_code" IN ('tiny', 'potential', 'whale');

CREATE INDEX IF NOT EXISTS "crm_customer_profiles_customer_tier_code_idx"
    ON "crm_customer_profiles"("customer_tier_code");

CREATE INDEX IF NOT EXISTS "crm_customer_profiles_gmv_monthly_idx"
    ON "crm_customer_profiles"("gmv_monthly");

ALTER TABLE "crm_deals"
    ADD COLUMN IF NOT EXISTS "product_package_code" TEXT;

UPDATE "crm_deals" AS "deal"
SET "product_package_code" = COALESCE(
    CASE
        WHEN "deal"."product_package" IN ('trial', '399', '699')
            THEN "deal"."product_package"
    END,
    CASE
        WHEN "profile"."tier_code" IN ('trial', '399', '699')
            THEN "profile"."tier_code"
    END,
    'trial'
)
FROM "crm_customer_profiles" AS "profile"
WHERE "profile"."id" = "deal"."customer_id"
  AND "deal"."product_package_code" IS NULL;

UPDATE "crm_deals"
SET "product_package" = "product_package_code"
WHERE "product_package_code" IS NOT NULL
  AND "product_package" <> "product_package_code";

CREATE INDEX IF NOT EXISTS "crm_deals_product_package_code_idx"
    ON "crm_deals"("product_package_code");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "pg_constraint"
        WHERE "conname" = 'crm_deals_product_package_code_fkey'
    ) THEN
        ALTER TABLE "crm_deals"
            ADD CONSTRAINT "crm_deals_product_package_code_fkey"
            FOREIGN KEY ("product_package_code")
            REFERENCES "crm_product_packages"("code")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;

DROP INDEX IF EXISTS "crm_deals_product_package_idx";

ALTER TABLE "crm_deals"
    DROP COLUMN IF EXISTS "product_package";

DROP INDEX IF EXISTS "crm_customer_profiles_tier_code_idx";

ALTER TABLE "crm_customer_profiles"
    DROP COLUMN IF EXISTS "tier_code";

DROP TABLE IF EXISTS "crm_tiers";
