# cheapaikey.store

Hệ thống bán và quản lý API Key Claude giá rẻ — thanh toán chuyển khoản ngân hàng Việt Nam, kích hoạt tức thì.

## Kiến trúc

```
User → Cloudflare → Nginx (essicode) → Nginx (ai-key:8443) → Backend NestJS → 9Router
                                                             → Frontend Next.js
```

| Domain | Dịch vụ |
|--------|---------|
| `cheapaikey.store` | Landing page + Dashboard (Next.js) |
| `api.cheapaikey.store` | Backend API (NestJS) |
| `9router.cheapaikey.store` | Giao diện 9Router (Basic Auth) |

---

## Deploy

### 1. Clone và chuẩn bị env

```bash
git clone <repo> && cd ai-key
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production
```

Điền các giá trị vào hai file `.env.production`.

### 2. Build và chạy

```bash
docker compose up -d --build
```

### 3. Seed dữ liệu lần đầu

```bash
docker compose exec backend npm run seed
```

### 4. Đăng ký Telegram webhook (sau khi deploy)

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://api.cheapaikey.store/telegram/webhook"
```

---

## Biến môi trường

### Backend (`backend/.env.production`)

| Biến | Mô tả |
|------|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự |
| `CORS_ORIGINS` | Domain frontend, ví dụ `https://cheapaikey.store` |
| `NINE_ROUTER_URL` | `http://nine-router:20128/v1` (giữ nguyên) |
| `NINE_ROUTER_PASSWORD` | Mật khẩu admin 9Router |
| `VIETQR_BANK_ID` | Mã ngân hàng VietQR |
| `VIETQR_ACCOUNT_NO` | Số tài khoản nhận tiền |
| `VIETQR_ACCOUNT_NAME` | Tên chủ tài khoản |
| `RESEND_API_KEY` | API key từ resend.com |
| `RESEND_FROM` | Email gửi, ví dụ `noreply@cheapaikey.store` |
| `APP_URL` | URL frontend, ví dụ `https://cheapaikey.store` |
| `RECAPTCHA_SECRET_KEY` | Secret key Google reCAPTCHA v3 |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram (tạo tại @BotFather) |
| `TELEGRAM_CHAT_ID` | Chat ID nhóm nhận thông báo nạp tiền |

### Frontend (`frontend/.env.production`)

| Biến | Mô tả |
|------|-------|
| `NEXT_PUBLIC_API_URL` | URL backend, ví dụ `https://api.cheapaikey.store` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Site key Google reCAPTCHA v3 |
| `NEXT_PUBLIC_SUPPORT_URL` | Link hỗ trợ Telegram, ví dụ `https://t.me/username` |

---

## Flow nạp tiền ví

1. User tạo đơn nạp trong dashboard → hệ thống sinh mã `NAPxxxxxx` duy nhất
2. Bot Telegram gửi thông báo vào group kèm nút **✅ Duyệt** / **❌ Từ chối**
3. Admin bấm nút → hệ thống cộng ví tự động + xóa message khỏi group
4. Đơn chưa xử lý sau **30 phút** → tự hết hạn + xóa message Telegram

---

## Cấu hình Claude Code

Thêm vào `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_BASE_URL": "https://api.cheapaikey.store/claude",
    "ANTHROPIC_API_KEY": "<api-key-của-bạn>",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "cc/claude-opus-4-8",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "cc/claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "cc/claude-haiku-4-5-20251001"
  }
}
```

---

## SSL

Đặt cert vào `nginx/ssl/cert_chain.pem` và `nginx/ssl/key.pem` trước khi chạy.

```bash
# Tạo/gia hạn cert qua Cloudflare Origin CA rồi copy vào:
cp fullchain.pem nginx/ssl/cert_chain.pem
cp privkey.pem   nginx/ssl/key.pem
```

---

## 9Router Basic Auth

```bash
# Đổi mật khẩu nginx/.htpasswd
openssl passwd -apr1 'mật_khẩu_mới'
# Paste hash vào nginx/.htpasswd theo format: admin:<hash>
```
