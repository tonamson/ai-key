# Plan: Subscription & Payment System
Created: 2026-06-29
Status: pending

## Analysis Decisions
- Approach: Proxy layer in NestJS to intercept /proxy/v1/* → validate key subscription + quota → forward to 9router
- Alternatives rejected: Relying on 9router's own usage tracking (SQLite local, no per-key quota enforcement API)
- VietQR: Static image via https://img.vietqr.io/image/{bank}-{account}-compact.png?amount=X&addInfo=Y — no SDK needed

---

## Task 1: DB Migration — plans, coupons, referral_codes, orders, key_subscriptions
Status: completed
Risk: high
Dependencies: none

Files:
- Create: backend/src/database/migrations/1782420000000-SubscriptionSchema.ts
- Create: backend/src/plans/plan.entity.ts
- Create: backend/src/coupons/coupon.entity.ts
- Create: backend/src/referral/referral-code.entity.ts
- Create: backend/src/orders/order.entity.ts
- Create: backend/src/subscriptions/key-subscription.entity.ts

Blast radius:
- backend/src/app.module.ts (entities list)
- backend/src/database/data-source.ts

Acceptance:
- Migration runs without error on fresh DB
- All 5 tables exist with correct columns and FK constraints
- Entities importable by TypeORM

TDD:
- Behavior: migration up creates all 5 tables with correct schema
- Test file: backend/src/database/migrations/1782420000000-SubscriptionSchema.ts
- Test name: n/a (migration verified by running)
- RED command: `cd backend && npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts`
- Expected RED failure: tables do not exist
- Minimal GREEN change: write and run the migration
- Mocking: none

Steps:
1. RED: verify tables don't exist yet
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx typeorm-ts-node-commonjs query "SELECT table_name FROM information_schema.tables WHERE table_name IN ('plans','coupons','referral_codes','orders','key_subscriptions')" -d src/database/data-source.ts`
   Expected: FAIL (0 rows)
2. GREEN: create entities + migration, run migration
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && TYPEORM_CLI=true npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `cd /Volumes/Code/Nodejs/ai-key/backend && TYPEORM_CLI=true npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts`

Checkpoint:
- Files: `backend/src/database/migrations/1782420000000-SubscriptionSchema.ts backend/src/plans/plan.entity.ts backend/src/coupons/coupon.entity.ts backend/src/referral/referral-code.entity.ts backend/src/orders/order.entity.ts backend/src/subscriptions/key-subscription.entity.ts`
- Commit: `feat: add subscription schema migration and entities`

---

## Task 2: Plans module — entity, service, controller, admin CRUD
Status: completed
Risk: low
Dependencies: Task 1

Files:
- Create: backend/src/plans/plans.service.ts
- Create: backend/src/plans/plans.controller.ts
- Create: backend/src/plans/plans.module.ts
- Create: backend/src/plans/dto/create-plan.dto.ts
- Create: backend/src/plans/dto/update-plan.dto.ts
- Modify: backend/src/app.module.ts

Blast radius:
- backend/src/orders/orders.service.ts (will import PlansService)

Acceptance:
- GET /admin/plans returns list of plans
- POST /admin/plans creates plan, requires admin:all
- PATCH /admin/plans/:id updates plan
- DELETE /admin/plans/:id soft-deletes (isActive=false)
- GET /plans returns only isActive=true plans (public for buy page)

TDD:
- Behavior: GET /plans returns only active plans
- Test file: backend/src/plans/plans.service.spec.ts
- Test name: findPublic returns only active plans
- RED command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest plans.service --no-coverage`
- Expected RED failure: PlansService not found
- Minimal GREEN change: create PlansService with findPublic()
- Mocking: InjectRepository(Plan) mock

Steps:
1. RED: write spec asserting findPublic filters isActive=true
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest plans.service --no-coverage`
   Expected: FAIL
2. GREEN: implement PlansService, PlansController, PlansModule
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest plans.service --no-coverage`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest plans.service --no-coverage`

Checkpoint:
- Files: `backend/src/plans/plans.service.ts backend/src/plans/plans.controller.ts backend/src/plans/plans.module.ts`
- Commit: `feat: plans module with admin CRUD`

---

## Task 3: Coupons module — entity, service, controller, admin CRUD
Status: completed
Risk: low
Dependencies: Task 1

Files:
- Create: backend/src/coupons/coupons.service.ts
- Create: backend/src/coupons/coupons.controller.ts
- Create: backend/src/coupons/coupons.module.ts
- Create: backend/src/coupons/dto/create-coupon.dto.ts
- Create: backend/src/coupons/dto/update-coupon.dto.ts
- Modify: backend/src/app.module.ts

Blast radius:
- backend/src/orders/orders.service.ts (validate + apply coupon)

Acceptance:
- POST /admin/coupons creates coupon with code, discountType, discountValue, maxUses, expiresAt
- GET /admin/coupons lists all coupons with usedCount
- POST /coupons/validate { code } returns coupon or 404/410 (expired/exhausted)
- Coupon validation checks: isActive, expiresAt > now, usedCount < maxUses

TDD:
- Behavior: validate rejects expired coupon
- Test file: backend/src/coupons/coupons.service.spec.ts
- Test name: validate throws BadRequest when coupon expired
- RED command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest coupons.service --no-coverage`
- Expected RED failure: CouponsService not found
- Minimal GREEN change: implement validate() with expiry check
- Mocking: InjectRepository(Coupon) mock

Steps:
1. RED: write spec for expired coupon rejection
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest coupons.service --no-coverage`
   Expected: FAIL
2. GREEN: implement CouponsService.validate()
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest coupons.service --no-coverage`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest coupons.service --no-coverage`

Checkpoint:
- Files: `backend/src/coupons/coupons.service.ts backend/src/coupons/coupons.controller.ts backend/src/coupons/coupons.module.ts`
- Commit: `feat: coupons module with admin CRUD and validation`

---

## Task 4: Referral module — auto-generate code on user register, track commission
Status: completed
Risk: medium
Dependencies: Task 1

Files:
- Create: backend/src/referral/referral.service.ts
- Create: backend/src/referral/referral.controller.ts
- Create: backend/src/referral/referral.module.ts
- Modify: backend/src/auth/auth.service.ts (generate referral code after register)
- Modify: backend/src/app.module.ts

Blast radius:
- backend/src/auth/auth.service.ts
- backend/src/orders/orders.service.ts (credit commission on payment confirm)

Acceptance:
- Every new user gets a referral_code row auto-created on register
- GET /referral/my-code returns current user's referral code + totalEarned
- ReferralService.creditCommission(referralCode, orderAmount) increments totalEarned by commissionPercent%
- Commission default 10%

TDD:
- Behavior: creditCommission increases totalEarned by 10% of order amount
- Test file: backend/src/referral/referral.service.spec.ts
- Test name: creditCommission adds 10% of amount to totalEarned
- RED command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest referral.service --no-coverage`
- Expected RED failure: ReferralService not found
- Minimal GREEN change: implement creditCommission()
- Mocking: InjectRepository(ReferralCode) mock

Steps:
1. RED: write spec asserting totalEarned += amount * 0.10
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest referral.service --no-coverage`
   Expected: FAIL
2. GREEN: implement ReferralService
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest referral.service --no-coverage`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest referral.service --no-coverage`

Checkpoint:
- Files: `backend/src/referral/referral.service.ts backend/src/referral/referral.controller.ts backend/src/referral/referral.module.ts`
- Commit: `feat: referral module with commission tracking`

---

## Task 5: Orders module — create order, VietQR, admin confirm
Status: completed
Risk: high
Dependencies: Task 1, Task 2, Task 3, Task 4

Files:
- Create: backend/src/orders/orders.service.ts
- Create: backend/src/orders/orders.controller.ts
- Create: backend/src/orders/orders.module.ts
- Create: backend/src/orders/dto/create-order.dto.ts
- Modify: backend/src/app.module.ts

Blast radius:
- backend/src/nine-router/nine-router.service.ts (createKey on confirm)
- backend/src/subscriptions/key-subscription.entity.ts (create subscription on confirm)
- backend/src/referral/referral.service.ts (creditCommission on confirm)
- backend/src/coupons/coupons.service.ts (increment usedCount on confirm)

Acceptance:
- POST /orders { planId, couponCode?, referralCode? } creates pending order, returns orderId + finalPrice + vietQRUrl
- VietQR URL format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact.png?amount={finalPrice}&addInfo=AIKEY-{orderId}
- PATCH /admin/orders/:id/confirm (admin:all) → sets status=paid, paidAt=now, calls NineRouterService.createKey(userName), creates KeySubscription, credits referral commission, increments coupon usedCount
- GET /admin/orders lists all orders with user/plan info
- GET /orders/my lists current user's orders

TDD:
- Behavior: confirm order creates KeySubscription with correct expiresAt
- Test file: backend/src/orders/orders.service.spec.ts
- Test name: confirmOrder creates KeySubscription expiring planDurationDays from now
- RED command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest orders.service --no-coverage`
- Expected RED failure: OrdersService not found
- Minimal GREEN change: implement confirmOrder() creating subscription
- Mocking: NineRouterService, CouponsService, ReferralService, repositories mocked

Steps:
1. RED: write spec asserting expiresAt = now + durationDays
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest orders.service --no-coverage`
   Expected: FAIL
2. GREEN: implement OrdersService with createOrder() and confirmOrder()
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest orders.service --no-coverage`
   Expected: PASS
3. REFACTOR: extract VietQR URL builder to helper
4. VERIFY:
   - `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest orders.service --no-coverage`

Checkpoint:
- Files: `backend/src/orders/orders.service.ts backend/src/orders/orders.controller.ts backend/src/orders/orders.module.ts`
- Commit: `feat: orders module with VietQR and admin confirm`

---

## Task 6: Subscriptions module — list, token usage query
Status: completed
Risk: low
Dependencies: Task 5

Files:
- Create: backend/src/subscriptions/subscriptions.service.ts
- Create: backend/src/subscriptions/subscriptions.controller.ts
- Create: backend/src/subscriptions/subscriptions.module.ts
- Modify: backend/src/app.module.ts

Blast radius:
- backend/src/proxy/proxy.service.ts (validate subscription + deduct tokens)

Acceptance:
- GET /subscriptions/my returns user's active subscriptions with tokenUsed, tokenQuota, expiresAt, nineRouterKey
- SubscriptionsService.findActiveByKey(nineRouterKey) returns subscription or null
- SubscriptionsService.deductTokens(id, inputTokens, outputTokens) increments tokenUsed, returns remaining

TDD:
- Behavior: deductTokens correctly sums input+output and updates tokenUsed
- Test file: backend/src/subscriptions/subscriptions.service.spec.ts
- Test name: deductTokens adds inputTokens + outputTokens to tokenUsed
- RED command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest subscriptions.service --no-coverage`
- Expected RED failure: SubscriptionsService not found
- Minimal GREEN change: implement deductTokens()
- Mocking: InjectRepository(KeySubscription) mock

Steps:
1. RED: write spec asserting tokenUsed increases by input+output
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest subscriptions.service --no-coverage`
   Expected: FAIL
2. GREEN: implement SubscriptionsService
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest subscriptions.service --no-coverage`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest subscriptions.service --no-coverage`

Checkpoint:
- Files: `backend/src/subscriptions/subscriptions.service.ts backend/src/subscriptions/subscriptions.controller.ts backend/src/subscriptions/subscriptions.module.ts`
- Commit: `feat: subscriptions module with token deduction`

---

## Task 7: Proxy module — /proxy/v1/* gateway with quota enforcement
Status: completed
Risk: high
Dependencies: Task 6

Files:
- Create: backend/src/proxy/proxy.service.ts
- Create: backend/src/proxy/proxy.controller.ts
- Create: backend/src/proxy/proxy.module.ts
- Modify: backend/src/app.module.ts

Blast radius:
- backend/src/subscriptions/subscriptions.service.ts
- backend/src/main.ts (raw body needed for streaming)

Acceptance:
- POST /proxy/v1/chat/completions with Authorization: Bearer sk-... → validates subscription, forwards to 9router, extracts usage.input_tokens + usage.output_tokens from response, calls deductTokens
- Returns 401 if key not found or subscription inactive
- Returns 429 if tokenUsed >= tokenQuota
- Returns 403 if subscription expired (expiresAt < now)
- Non-streaming: parse JSON response for usage fields
- ALL /proxy/v1/* paths forwarded (pass-through for /models etc)

TDD:
- Behavior: proxy returns 429 when quota exhausted
- Test file: backend/src/proxy/proxy.service.spec.ts
- Test name: forward throws 429 when tokenUsed >= tokenQuota
- RED command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest proxy.service --no-coverage`
- Expected RED failure: ProxyService not found
- Minimal GREEN change: implement quota check before forward
- Mocking: SubscriptionsService mock

Steps:
1. RED: write spec for quota exhausted 429
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest proxy.service --no-coverage`
   Expected: FAIL
2. GREEN: implement ProxyService.forward() with quota guard
   Command: `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest proxy.service --no-coverage`
   Expected: PASS
3. REFACTOR: extract token extraction to parseUsage() helper
4. VERIFY:
   - `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest proxy.service --no-coverage`

Checkpoint:
- Files: `backend/src/proxy/proxy.service.ts backend/src/proxy/proxy.controller.ts backend/src/proxy/proxy.module.ts`
- Commit: `feat: proxy gateway with quota enforcement`

---

## Task 8: Frontend — admin pages (plans, coupons, orders)
Status: completed
Risk: low
Dependencies: Task 2, Task 3, Task 5

Files:
- Create: frontend/app/(app)/admin/plans/page.tsx
- Create: frontend/app/(app)/admin/coupons/page.tsx
- Create: frontend/app/(app)/admin/orders/page.tsx
- Modify: frontend/lib/api/admin.service.ts
- Modify: frontend/components/app-sidebar.tsx

Blast radius:
- frontend/components/app-sidebar.tsx

Acceptance:
- /admin/plans: table of plans, create/edit dialog (name, tokenQuota, durationDays, price, isActive), delete
- /admin/coupons: table of coupons with usedCount, create/edit dialog (code, discountType, discountValue, maxUses, expiresAt, isActive)
- /admin/orders: table with user name, plan name, status badge, finalPrice, paidAt; "Xác nhận" button on pending orders → calls PATCH /admin/orders/:id/confirm
- Sidebar admin section gets "Đơn hàng" link

TDD:
- Behavior: n/a (UI pages, verified visually)
- Test file: none
- Test name: none
- RED command: none
- Expected RED failure: none
- Minimal GREEN change: implement pages following existing roleApi/adminUserApi pattern
- Mocking: none

Steps:
1. RED: n/a
2. GREEN: implement 3 admin pages + API client methods
3. REFACTOR: none
4. VERIFY:
   - TypeScript compile: `cd /Volumes/Code/Nodejs/ai-key/frontend && npx tsc --noEmit`

Checkpoint:
- Files: `frontend/app/(app)/admin/plans/page.tsx frontend/app/(app)/admin/coupons/page.tsx frontend/app/(app)/admin/orders/page.tsx frontend/lib/api/admin.service.ts`
- Commit: `feat: admin pages for plans, coupons, orders`

---

## Task 9: Frontend — user pages (buy flow, my keys)
Status: completed
Risk: medium
Dependencies: Task 5, Task 6, Task 8

Files:
- Create: frontend/app/(app)/dashboard/buy/page.tsx
- Create: frontend/app/(app)/dashboard/keys/page.tsx
- Modify: frontend/lib/api/admin.service.ts
- Modify: frontend/components/app-sidebar.tsx

Blast radius:
- frontend/components/app-sidebar.tsx

Acceptance:
- /dashboard/buy: step 1 pick plan card, step 2 enter coupon code (shows discount), enter referral code, show finalPrice, step 3 VietQR image + payment info, polls GET /orders/my every 5s until status=paid → redirect to /dashboard/keys
- /dashboard/keys: list active subscriptions: plan name, nineRouterKey (masked + copy button), token usage progress bar (tokenUsed/tokenQuota), expiresAt countdown badge
- Sidebar main section gets "Mua key" (/dashboard/buy) and "Keys của tôi" (/dashboard/keys)

TDD:
- Behavior: n/a (UI pages)
- Test file: none
- Test name: none
- RED command: none
- Expected RED failure: none
- Minimal GREEN change: implement pages following existing page patterns
- Mocking: none

Steps:
1. RED: n/a
2. GREEN: implement buy flow + keys page
3. REFACTOR: none
4. VERIFY:
   - TypeScript compile: `cd /Volumes/Code/Nodejs/ai-key/frontend && npx tsc --noEmit`

Checkpoint:
- Files: `frontend/app/(app)/dashboard/buy/page.tsx frontend/app/(app)/dashboard/keys/page.tsx`
- Commit: `feat: user buy flow and key dashboard pages`

---

## Task 10: Seed default plans + add permissions
Status: completed
Risk: low
Dependencies: Task 1, Task 2

Files:
- Modify: backend/src/database/seeds/index.ts
- Modify: backend/src/auth/role-keys.ts

Blast radius:
- backend/src/auth/guards/roles.guard.ts

Acceptance:
- Seed creates 1 default plan: {name:'Gói Tháng', tokenQuota:21000000, durationDays:30, price:350000}
- role-keys.ts adds permissions: 'plans:manage', 'coupons:manage', 'orders:manage' to super_admin and manager
- super_admin and manager can access all admin pages

TDD:
- Behavior: seed inserts default plans if not exist
- Test file: none (seed verified by running)
- Test name: none
- RED command: `cd /Volumes/Code/Nodejs/ai-key/backend && TYPEORM_CLI=true npx ts-node src/database/seeds/index.ts`
- Expected RED failure: Plan table missing (before Task 1)
- Minimal GREEN change: add planSeeds array to seed script
- Mocking: none

Steps:
1. RED: n/a (dependent on Task 1 migration)
2. GREEN: add planSeeds to seed, add permissions to role-keys.ts
3. REFACTOR: none
4. VERIFY:
   - `cd /Volumes/Code/Nodejs/ai-key/backend && TYPEORM_CLI=true npx ts-node src/database/seeds/index.ts`

Checkpoint:
- Files: `backend/src/database/seeds/index.ts backend/src/auth/role-keys.ts`
- Commit: `feat: seed default plans and add subscription permissions`

---

## Environment Context
- **Language:** TypeScript / Node.js 20
- **Test command:** `cd /Volumes/Code/Nodejs/ai-key/backend && npx jest --no-coverage`
- **Linter command:** none configured
- **Formatter command:** none configured
- **Build command:** `cd /Volumes/Code/Nodejs/ai-key/backend && npm run build`
- **Branch:** main
- **Conventional commit style:** `feat: / fix:`

**Codebase conventions:**
- Entities: `@Entity('table_name')`, uuid PK, CreateDateColumn/UpdateDateColumn
- Modules: service + controller + module.ts, registered in app.module.ts imports array AND entities array
- Guards: `@RequirePermission('permission:key')` decorator on controller class
- DTOs: class-validator decorators, IsOptional for optional fields
- Frontend: 'use client', useState/useEffect pattern, toast.error for errors, roleApi pattern for API calls
- Frontend API: `apiClient.get/post/patch/delete` → `.then(r => r.data)`

**Graph Context:**
- Blast radius: ~25 files
- Hub nodes: app.module.ts (all modules register here), auth.service.ts (register flow), app-sidebar.tsx (all nav links)
- Bridge nodes: NineRouterService (proxy + orders both depend), SubscriptionsService (proxy depends)
- Communities crossed: auth, admin, user-facing dashboard
