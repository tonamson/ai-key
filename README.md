# AI Key

Hệ thống bán và quản lý API key Claude qua proxy NestJS → 9Router.

## Kiến trúc

```
User → Cloudflare → Nginx → Backend (NestJS) → nine-router (Docker internal)
                          → Frontend (Next.js)
```

- `api.moneynote.store` → backend proxy Claude API
- `moneynote.store` → frontend dashboard
- `9router.moneynote.store` → giao diện 9Router (có mật khẩu)

---

## Deploy nhanh

### 1. Clone và chuẩn bị env

```bash
git clone <repo> && cd ai-key

cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production
```

Điền các giá trị vào hai file `.env.production` (xem phần **Biến môi trường** bên dưới).

### 2. Chạy

```bash
docker compose up -d --build
```

### 3. Seed dữ liệu lần đầu

```bash
docker compose exec backend npm run seed
```

---

## Biến môi trường

### Backend (`backend/.env.production`)

| Biến | Mô tả |
|------|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự |
| `CORS_ORIGINS` | Domain frontend, ví dụ `https://moneynote.store` |
| `NINE_ROUTER_URL` | `http://nine-router:20128/v1` (giữ nguyên) |
| `NINE_ROUTER_PASSWORD` | Mật khẩu admin 9Router |
| `VIETQR_BANK_ID` | Mã ngân hàng VietQR |
| `VIETQR_ACCOUNT_NO` | Số tài khoản nhận tiền |
| `VIETQR_ACCOUNT_NAME` | Tên chủ tài khoản |
| `RESEND_API_KEY` | API key từ resend.com |
| `RESEND_FROM` | Email gửi, ví dụ `noreply@moneynote.store` |
| `APP_URL` | URL frontend, ví dụ `https://moneynote.store` |
| `RECAPTCHA_SECRET_KEY` | Secret key Google reCAPTCHA v3 |

### Frontend (`frontend/.env.production`)

| Biến | Mô tả |
|------|-------|
| `NEXT_PUBLIC_API_URL` | URL backend, ví dụ `https://api.moneynote.store` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Site key Google reCAPTCHA v3 |

---

## Mật khẩu & tài khoản

| Dịch vụ | URL | Tài khoản |
|---------|-----|-----------|
| 9Router dashboard | `https://9router.moneynote.store` | `admin` / `adminkanni@123` |
| 9Router admin (trong app) | — | Dùng `NINE_ROUTER_PASSWORD` trong env |

> **Lưu ý:** Đổi mật khẩu Basic Auth bằng cách sửa `nginx/.htpasswd`.
> Tạo hash mới: `openssl passwd -apr1 'mật_khẩu_mới'`

---

## Cấu hình Claude Code (dùng thử)

Thêm vào `~/.claude/settings.json` của user:

```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_BASE_URL": "https://api.moneynote.store/claude",
    "ANTHROPIC_API_KEY": "sk-...",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "cc/claude-opus-4-8",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "cc/claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "cc/claude-haiku-4-5-20251001"
  }
}
```

> Dùng `ANTHROPIC_API_KEY` (không phải `ANTHROPIC_AUTH_TOKEN`) để gửi đúng header `x-api-key`.

---

## SSL

Đặt cert vào `nginx/ssl/cert.pem` và `nginx/ssl/key.pem` trước khi chạy.
