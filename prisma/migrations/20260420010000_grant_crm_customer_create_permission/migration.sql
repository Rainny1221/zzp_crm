-- Allow sales-facing roles to create CRM customers directly.
INSERT INTO "permission_roles" ("permission_id", "role_id")
SELECT p."id", r."id"
FROM "permissions" p
JOIN "roles" r ON r."name" IN ('ADMIN', 'SALE_MANAGER', 'SALE')
WHERE p."name" = 'CRM_CUSTOMER_CREATE'
  AND p."deleted_at" IS NULL
  AND r."deleted_at" IS NULL
ON CONFLICT ("permission_id", "role_id") DO NOTHING;
