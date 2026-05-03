CREATE TABLE IF NOT EXISTS crm_kpi_targets (
  id SERIAL PRIMARY KEY,
  scope_type TEXT NOT NULL,
  owner_user_id INTEGER,
  period_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  leads_target INTEGER NOT NULL DEFAULT 0,
  qualified_target INTEGER NOT NULL DEFAULT 0,
  won_deals_target INTEGER NOT NULL DEFAULT 0,
  pipeline_value_target NUMERIC(14, 2) NOT NULL DEFAULT 0,
  won_value_target NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_kpi_targets_scope_type_period_start_period_end_idx
  ON crm_kpi_targets(scope_type, period_start, period_end);

CREATE INDEX IF NOT EXISTS crm_kpi_targets_owner_user_id_period_start_period_end_idx
  ON crm_kpi_targets(owner_user_id, period_start, period_end);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_kpi_targets_scope_owner_period_un'
  ) THEN
    ALTER TABLE crm_kpi_targets
      ADD CONSTRAINT crm_kpi_targets_scope_owner_period_un
      UNIQUE (scope_type, owner_user_id, period_start);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_kpi_targets_owner_user_id_fkey'
  ) THEN
    ALTER TABLE crm_kpi_targets
      ADD CONSTRAINT crm_kpi_targets_owner_user_id_fkey
      FOREIGN KEY (owner_user_id)
      REFERENCES users(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_kpi_targets_created_by_fkey'
  ) THEN
    ALTER TABLE crm_kpi_targets
      ADD CONSTRAINT crm_kpi_targets_created_by_fkey
      FOREIGN KEY (created_by)
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
    ('CRM_KPI_VIEW'),
    ('CRM_KPI_MANAGE')
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
WHERE p."name" IN ('CRM_KPI_VIEW', 'CRM_KPI_MANAGE')
  AND p."deleted_at" IS NULL
  AND r."deleted_at" IS NULL
ON CONFLICT ("permission_id", "role_id") DO NOTHING;
