# Migration & Seed trên Docker

## Bối cảnh

- Image `backend` chỉ chứa `dist/` (compiled JS) — không có `ts-node` hay source `.ts`.
- Script `migration:run` và `seed:run` trong `package.json` dùng `ts-node`, chỉ chạy được ở môi trường local có `node_modules` đầy đủ.
- Trên Docker dùng script `db:migrate` và `db:seed` — chạy từ `dist/` đã build sẵn.

---

## Chạy migration

```bash
docker compose exec backend node -e "
  require('./dist/database/data-source').AppDataSource
    .initialize()
    .then(ds => ds.runMigrations())
    .then(() => { console.log('Migrations done'); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); })
"
```

Hoặc dùng npm script đã có:

```bash
docker compose exec backend npm run db:migrate
```

> Migration chỉ chạy các file chưa có trong bảng `migrations`. Chạy nhiều lần là an toàn.

---

## Chạy seed

```bash
docker compose exec backend node dist/database/seeds/index.js
```

Hoặc:

```bash
docker compose exec backend npm run db:seed
```

Seed dùng `upsert` / skip nên **idempotent** — chạy lại không tạo bản ghi trùng.

**Tài khoản mặc định sau seed:**

| Email | Mật khẩu | Role |
|-------|-----------|------|
| admin@aikey.com | Admin@123 | super_admin |
| cskh@aikey.com | Cskh@123 | cs_staff |
| user@aikey.com | User@123 | user |

> Đổi mật khẩu ngay sau khi seed lần đầu trên production.

---

## Tạo migration mới (local)

```bash
cd backend
npm run migration:generate --name=TenMigration
```

File mới xuất hiện ở `src/database/migrations/`. Commit vào git, build lại image, rồi chạy `db:migrate` trên server.

---

## Revert migration gần nhất (local)

```bash
cd backend
npm run migration:revert
```

Trên Docker không expose script này — nếu cần revert trên production, chạy trực tiếp:

```bash
docker compose exec backend node -e "
  require('./dist/database/data-source').AppDataSource
    .initialize()
    .then(ds => ds.undoLastMigration())
    .then(() => { console.log('Reverted'); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); })
"
```

---

## Workflow deploy thông thường

```bash
# 1. Build lại image với code mới (bao gồm migration files mới)
docker compose build backend

# 2. Khởi động lại service
docker compose up -d backend

# 3. Chạy migration
docker compose exec backend npm run db:migrate

# Seed chỉ cần chạy lần đầu hoặc khi thêm plan/role mới
# docker compose exec backend npm run db:seed
```
