DO $$
DECLARE
    legacy_package_code TEXT := concat('3', '99');
BEGIN
    INSERT INTO "crm_product_packages" ("code", "label", "sort_order", "is_active")
    VALUES ('499', 'Gói 499k', 2, true)
    ON CONFLICT ("code") DO UPDATE SET
        "label" = EXCLUDED."label",
        "sort_order" = EXCLUDED."sort_order",
        "is_active" = EXCLUDED."is_active";

    UPDATE "crm_deals"
    SET "product_package_code" = '499'
    WHERE "product_package_code" = legacy_package_code;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'crm_deals'
          AND column_name = 'product_package'
    ) THEN
        EXECUTE format(
            'UPDATE "crm_deals" SET "product_package" = %L WHERE "product_package" = %L',
            '499',
            legacy_package_code
        );
    END IF;

    DELETE FROM "crm_product_packages"
    WHERE "code" = legacy_package_code;
END $$;
