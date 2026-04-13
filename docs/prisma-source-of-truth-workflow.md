# Prisma Workflow

This repository uses Prisma in a schema-first, migration-first workflow.

## Target model

- `local`, `staging`, and `production` follow the same schema workflow.
- The source of truth after bootstrap is:
  - Prisma schema files in `prisma/`
  - SQL migrations in `prisma/migrations/`
- `prisma db pull` is allowed only for bootstrap and controlled reconciliation.
- `prisma db push` is forbidden.

## Schema layout

```text
prisma/
├── schema.prisma          # generator + datasource only
├── migrations/
└── models/
    ├── core.prisma
    ├── user.prisma
    └── pipeline.prisma
```

Rules:

- Keep `prisma/schema.prisma` small.
- Put domain models and enums into `prisma/models/*.prisma`.
- Group related models in the same file.
- Cross-file relations are allowed.

## Required runtime

Prisma ORM 7 requires Node.js `20.19.0+`.

Use:

```bash
nvm use
```

## Current bootstrap state

Today, your local database is a clone of staging.

That is good for the initial bootstrap. Use it once to bring Prisma schema files in sync with the real database shape, then switch to normal migration-first development.

## One-time bootstrap

1. Point `DATABASE_URL` to your local cloned database.
2. If you need Prisma CLI to target another database temporarily, set `PRISMA_DATABASE_URL` in `.env.prisma`.
3. Make sure the local PostgreSQL instance is running.
4. Pull and validate:

```bash
nvm use
pnpm prisma:bootstrap
```

5. Review the generated schema files in `prisma/models/`.
6. Create a baseline migration only after the schema fully matches the cloned staging structure:

```bash
nvm use
pnpm prisma:migrate:baseline
pnpm prisma:migrate:resolve:baseline
```

Result:

- `prisma/migrations/000_init/migration.sql` becomes the starting point for all environments.
- from that moment on, schema changes are made from Prisma files and migrations, not by editing databases first.

## Day-to-day development

All future schema work starts from Prisma files, not from database changes.

### Pre-flight before changing schema

1. Start the local database.
2. Switch to the required Node version.
3. Make sure your branch is up to date.
4. Check migration state:

```bash
nvm use
pnpm prisma:migrate:status
```

If local DB is down, start it first. If migration status is not clean, fix that before creating a new migration.

### Normal change flow

1. Edit Prisma files:

- `prisma/models/*.prisma`
- `prisma/schema.prisma` only if generator/datasource changes

2. Create and apply the migration on local:

```bash
nvm use
pnpm prisma:migrate:dev --name your_change_name
```

3. Regenerate and validate:

```bash
nvm use
pnpm prisma:generate
pnpm prisma:validate
```

4. Review the generated SQL in the new folder under `prisma/migrations/`.
5. Run the app/tests that touch the changed tables.
6. Commit:

- schema file changes
- migration SQL

### Example: add a column to `User`

Edit [user.prisma](/Users/vuluuhoai/Documents/GitHub/zzp_crm/prisma/models/user.prisma):

```prisma
model User {
  // ...
  last_login_at DateTime? @db.Timestamptz(6)
}
```

Then run:

```bash
nvm use
pnpm prisma:migrate:dev --name add_user_last_login_at
pnpm prisma:generate
pnpm prisma:validate
```

Review the generated SQL before committing.

### Example: add a new table related to `Role`

Create the model in the appropriate schema file, for example `prisma/models/user.prisma`:

```prisma
model RoleAuditLog {
  id         Int      @id @default(autoincrement())
  role_id     Int
  action      String   @db.VarChar(100)
  created_at   DateTime @default(now()) @db.Timestamptz(6)

  role Role @relation(fields: [role_id], references: [id], onDelete: Cascade)

  @@index([role_id])
  @@map("role_audit_logs")
}
```

Then:

```bash
nvm use
pnpm prisma:migrate:dev --name add_role_audit_logs
pnpm prisma:generate
pnpm prisma:validate
```

### Example: rename or backfill safely

For renames or destructive changes, do not trust the generated SQL blindly.

Workflow:

1. Change the Prisma schema.
2. Run:

```bash
nvm use
pnpm prisma:migrate:dev --name rename_user_field --create-only
```

3. Open the generated `migration.sql`.
4. Replace destructive `DROP` and `ADD` with the safe SQL you actually want, for example `ALTER TABLE ... RENAME COLUMN ...`.
5. Apply the migration locally:

```bash
nvm use
pnpm prisma migrate dev
```

Use the same approach for data backfills, enum transitions, or trigger updates.

## Deploy to staging and production

Use the same committed migration history everywhere.

```bash
nvm use
pnpm prisma:migrate:deploy
```

Environment target:

- local: `DATABASE_URL` points to local DB
- staging: `DATABASE_URL` or `PRISMA_DATABASE_URL` points to staging DB
- production: `DATABASE_URL` or `PRISMA_DATABASE_URL` points to production DB

### Staging checklist

1. Merge the branch containing:

- updated Prisma schema files
- generated migration folder

2. Ensure the staging DB connection is correct.
3. Run:

```bash
nvm use
pnpm prisma:migrate:deploy
pnpm prisma:migrate:status
```

4. Deploy the application code that expects the new schema.
5. Smoke test the affected user/role/permission flows.

### Production checklist

1. Confirm the exact same commit already passed on staging.
2. Point `DATABASE_URL` to production.
3. Run:

```bash
nvm use
pnpm prisma:migrate:deploy
pnpm prisma:migrate:status
```

4. Deploy app code.
5. Verify logs and critical CRM flows.

## Allowed and forbidden commands

Allowed:

- `pnpm prisma:pull`
- `pnpm prisma:bootstrap`
- `pnpm prisma:validate`
- `pnpm prisma:generate`
- `pnpm prisma:format`
- `pnpm prisma:migrate:dev`
- `pnpm prisma:migrate:deploy`
- `pnpm prisma:migrate:status`
- `pnpm prisma:drift:check`

Forbidden:

- `pnpm prisma:db:push`
- direct SQL schema changes except approved DBA emergency
- editing staging/prod schema first and trying to reconcile later as a normal workflow

## Drift handling

If drift happens:

1. Stop creating new migrations.
2. Identify whether the drift happened only on local, or also on staging/prod.
3. If the database was changed out-of-band and must be preserved, introspect that state into a branch:

```bash
nvm use
pnpm prisma:pull
pnpm prisma:generate
pnpm prisma:validate
```

4. Convert the resulting delta into a proper migration and recommit it.
5. Do not use `db push` to hide the drift.

## Triggers, functions, and event pipeline objects

Prisma does not model every database object.

For this CRM system:

- triggers
- functions
- custom indexes
- event pipeline SQL objects

must live in committed migration SQL when they affect staging/prod behavior.

Practical rule:

- Prisma schema describes tables, columns, relations, enums, indexes Prisma understands.
- Anything Prisma cannot represent must be appended and reviewed inside the migration SQL.

Recommended flow for trigger or function changes:

1. Create the Prisma migration with `--create-only` if schema objects also changed.
2. Append the trigger/function SQL manually into that migration.
3. Apply locally.
4. Commit the migration SQL.

## Team rule

After the bootstrap is finished, treat this repository as the authority for schema evolution.

That is what keeps `local = staging = prod` in the long term.
