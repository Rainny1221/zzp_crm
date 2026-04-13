# Playbook Prisma: Local -> Staging -> Production

Tài liệu này dùng cho team khi thay đổi schema database bằng Prisma trong dự án CRM.

## 1. Nguyên tắc chung

- `local`, `staging`, `production` dùng cùng một flow migration.
- Schema chuẩn nằm trong code:
  - `prisma/schema.prisma`
  - `prisma/models/*.prisma`
  - `prisma/migrations/*`
- Không dùng `prisma db push`.
- Không sửa DB staging/prod trực tiếp như flow thường ngày.
- Mọi thay đổi schema phải đi qua migration và được commit vào git.
- Local hiện tại là bản clone từ staging, và đã được baseline xong.

## 2. Cấu trúc schema

- `prisma/schema.prisma`: chỉ chứa `generator` và `datasource`
- `prisma/models/user.prisma`: các model liên quan `User`, `Role`, `Permission`
- `prisma/models/pipeline.prisma`: các model CRM pipeline
- `prisma/models/core.prisma`: phần schema legacy/chưa tách tiếp
- `prisma/migrations/`: lịch sử migration để apply cho staging/prod

## 3. Trước khi thay đổi schema

Luôn chạy:

```bash
nvm use
pnpm prisma:migrate:status
```

Nếu status chưa sạch thì không tạo migration mới.

## 4. Khi thay đổi table hoặc schema ở local

### Trường hợp 1: thêm field vào table có sẵn

Ví dụ thêm field vào `User`.

Bước 1: sửa file schema phù hợp, ví dụ `prisma/models/user.prisma`

```prisma
model User {
  // ...
  last_login_at DateTime? @db.Timestamptz(6)
}
```

Bước 2: tạo migration mới ở local

```bash
nvm use
pnpm prisma:migrate:dev --name add_user_last_login_at
```

Bước 3: generate lại Prisma Client và validate schema

```bash
pnpm prisma:generate
pnpm prisma:validate
```

Bước 4: review migration SQL vừa được tạo trong `prisma/migrations/...`

Bước 5: test app hoặc API liên quan

Bước 6: commit code

Phải commit:
- file schema đã sửa
- folder migration mới tạo

### Trường hợp 2: thêm table mới

Ví dụ thêm bảng `role_audit_logs`.

Thêm model vào `prisma/models/user.prisma`:

```prisma
model RoleAuditLog {
  id         Int      @id @default(autoincrement())
  role_id    Int
  action     String   @db.VarChar(100)
  created_at DateTime @default(now()) @db.Timestamptz(6)

  role Role @relation(fields: [role_id], references: [id], onDelete: Cascade)

  @@index([role_id])
  @@map("role_audit_logs")
}
```

Sau đó chạy:

```bash
nvm use
pnpm prisma:migrate:dev --name add_role_audit_logs
pnpm prisma:generate
pnpm prisma:validate
```

Review SQL, test, rồi commit.

### Trường hợp 3: thêm relation giữa các table

Ví dụ thêm relation giữa 2 model.

Bước 1: sửa schema ở file domain tương ứng

Bước 2: chạy migration

```bash
nvm use
pnpm prisma:migrate:dev --name add_relation_xxx
pnpm prisma:generate
pnpm prisma:validate
```

Bước 3: review SQL cẩn thận, nhất là foreign key, index, `onDelete`

### Trường hợp 4: đổi tên cột, đổi enum, thay đổi có nguy cơ mất dữ liệu

Không chạy flow auto bình thường ngay.

Bước đúng:

```bash
nvm use
pnpm prisma:migrate:dev --name rename_xxx --create-only
```

Sau đó:
- mở file `migration.sql`
- sửa tay SQL cho an toàn
- ví dụ dùng `ALTER TABLE ... RENAME COLUMN ...`
- tránh để Prisma tự tạo `DROP COLUMN` và `ADD COLUMN` nếu dữ liệu cần giữ lại

Sau khi sửa SQL xong, apply lại:

```bash
pnpm prisma migrate dev
pnpm prisma:generate
pnpm prisma:validate
```

Rồi mới test và commit.

## 5. Sau khi sửa schema ở local

Một thay đổi schema chỉ được xem là hoàn tất khi đã làm đủ:

```bash
nvm use
pnpm prisma:migrate:status
pnpm prisma:generate
pnpm prisma:validate
```

Và:
- app chạy được
- API liên quan không lỗi
- migration SQL đã được review
- code đã commit

## 6. Đưa thay đổi lên staging

Sau khi PR merge, staging phải apply đúng migration đã commit.

### Checklist staging

1. Đảm bảo staging dùng đúng commit đã merge
2. Trỏ `DATABASE_URL` của staging vào DB staging
3. Chạy:

```bash
nvm use
pnpm prisma:migrate:deploy
pnpm prisma:migrate:status
```

4. Deploy application code
5. Smoke test các flow liên quan

Ví dụ nếu sửa `User`, `Role`, `Permission` thì test:
- login, auth
- get profile
- update profile
- role, permission checks
- các API guard liên quan

## 7. Đưa thay đổi lên production

Production chỉ dùng lại đúng migration đã pass staging.

### Checklist production

1. Xác nhận commit đã chạy ổn trên staging
2. Trỏ `DATABASE_URL` vào DB production
3. Chạy:

```bash
nvm use
pnpm prisma:migrate:deploy
pnpm prisma:migrate:status
```

4. Deploy application code
5. Kiểm tra log, metrics, và các flow quan trọng

## 8. Lệnh chuẩn cần nhớ

### Kiểm tra trạng thái migration

```bash
pnpm prisma:migrate:status
```

### Tạo migration mới khi thay đổi schema

```bash
pnpm prisma:migrate:dev --name ten_thay_doi
```

### Generate Prisma Client

```bash
pnpm prisma:generate
```

### Validate schema

```bash
pnpm prisma:validate
```

### Deploy migration lên staging và prod

```bash
pnpm prisma:migrate:deploy
```

## 9. Những điều không được làm

Không được dùng:

```bash
pnpm prisma:db:push
```

Không được:
- sửa DB staging/prod trực tiếp rồi mới cập nhật schema sau
- tạo migration mới khi local DB đang lệch hoặc status chưa sạch
- merge schema change mà không có migration SQL
- tin hoàn toàn vào SQL auto-generated trong các case rename, backfill, enum change

## 10. Rule thực tế cho team

### Nếu chỉ thêm field, thêm table, thêm relation

Flow chuẩn là:

```bash
nvm use
pnpm prisma:migrate:status
# sửa schema
pnpm prisma:migrate:dev --name ten_thay_doi
pnpm prisma:generate
pnpm prisma:validate
# test
# commit
```

### Nếu thay đổi có nguy cơ mất dữ liệu

Flow chuẩn là:

```bash
nvm use
pnpm prisma:migrate:dev --name ten_thay_doi --create-only
# sửa tay migration.sql
pnpm prisma migrate dev
pnpm prisma:generate
pnpm prisma:validate
# test
# commit
```

### Khi lên staging và prod

Chỉ chạy:

```bash
nvm use
pnpm prisma:migrate:deploy
pnpm prisma:migrate:status
```

## 11. Kết luận ngắn

- Local là nơi tạo migration
- Staging là nơi kiểm tra migration đã commit
- Production chỉ apply lại đúng migration đã pass staging
- Schema chỉ thay đổi từ code Prisma và migration SQL
- Không dùng `db push`
- Không sửa DB trực tiếp như quy trình thường ngày
