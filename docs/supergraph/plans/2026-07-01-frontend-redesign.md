# Plan: Frontend Redesign — SaaS AI Key Platform
Date: 2026-07-01
Status: pending

## Analysis Decisions
- Approach: Full redesign — theme system first (P0), then landing, auth, shell, dashboard
- Light mode: White/Clean — #FFFFFF bg, #F8FAFC card, #1485FF accent
- Dark mode: True Dark + Neon — #080B0F bg, #111827 card, #1485FF with glow effects
- Alternatives rejected: partial restyle (too inconsistent), new UI lib (no deps)
- Risks: next-themes hydration flash (mitigated with suppressHydrationWarning), Tailwind v4 @custom-variant

---

## Task 1: Theme System — globals.css light + dark CSS vars
Status: pending
Risk: high
Dependencies: none

Files:
- Modify: frontend/app/globals.css

Blast radius:
- frontend/app/layout.tsx
- frontend/app/(app)/layout.tsx
- All pages consuming CSS vars via Tailwind

Acceptance:
- :root defines full light palette (#FFFFFF bg, #F8FAFC card, #0F172A foreground)
- .dark defines True Dark + Neon palette (#080B0F bg, #111827 card, glow tokens)
- --glow-primary CSS var defined for reuse
- No hardcoded dark-only palette in :root

TDD:
- Behavior: CSS vars resolve correctly per theme class
- Test file: none (visual — verified by dev server)
- Test name: n/a
- RED command: n/a
- Expected RED failure: n/a
- Minimal GREEN change: current :root has NO light palette (comment says "App luôn dark") — write :root as new light palette from scratch, then update .dark block with True Dark + Neon + --glow-primary
- Mocking: none

Steps:
1. GREEN: Write new :root light palette (FFFFFF bg, F8FAFC card, 0F172A fg) from scratch; update .dark block with neon dark palette + --glow-primary token
   - :root = light palette (new, not replacement)
   - .dark = True Dark + Neon palette + --glow-primary token
2. VERIFY:
   - `cd frontend && yarn build` — no CSS errors

Checkpoint:
- Files: `frontend/app/globals.css`
- Commit: `feat(ui): add light/dark theme CSS vars with neon glow tokens`

---

## Task 2: ThemeProvider + root layout wiring
Status: pending
Risk: medium
Dependencies: Task 1

Files:
- Modify: frontend/app/layout.tsx
- Create: frontend/components/theme-provider.tsx

Blast radius:
- frontend/app/(app)/layout.tsx (reads theme context)
- frontend/components/app-sidebar.tsx (theme-aware)

Acceptance:
- ThemeProvider wraps app with attribute="class" defaultTheme="dark" enableSystem
- html tag no longer hardcodes className="dark"
- suppressHydrationWarning on html to prevent flash
- next-themes ThemeProvider imported from next-themes

TDD:
- Behavior: app renders without hydration mismatch
- Test file: none (SSR behavior — verified by dev server)
- Minimal GREEN change: wrap children in ThemeProvider, remove dark from html className
- Mocking: none

Steps:
1. GREEN: Create theme-provider.tsx wrapper, update layout.tsx
2. VERIFY:
   - `cd frontend && yarn build`
   - Confirm next-themes sets attribute="class" so .dark lands on <html> — @custom-variant dark (&:is(.dark *)) depends on this

Checkpoint:
- Files: `frontend/components/theme-provider.tsx frontend/app/layout.tsx`
- Commit: `feat(ui): wire next-themes ThemeProvider, remove hardcoded dark class`

---

## Task 3: ThemeToggle component + app header
Status: pending
Risk: low
Dependencies: Task 2

Files:
- Create: frontend/components/theme-toggle.tsx
- Modify: frontend/app/(app)/layout.tsx

Blast radius:
- frontend/app/(app)/layout.tsx

Acceptance:
- ThemeToggle renders Sun icon in dark mode, Moon icon in light mode
- Clicking toggles theme via next-themes useTheme
- Button placed in app header next to NotificationBell
- Animated transition between icons

TDD:
- Behavior: toggle button visible in app header
- Test file: none
- Minimal GREEN change: useTheme hook + conditional icon render
- Mocking: none

Steps:
1. GREEN: Create theme-toggle.tsx, add to (app)/layout.tsx header
2. VERIFY:
   - `cd frontend && yarn lint`

Checkpoint:
- Files: `frontend/components/theme-toggle.tsx frontend/app/(app)/layout.tsx`
- Commit: `feat(ui): add ThemeToggle button to app header`

---

## Task 4: Landing page redesign
Status: pending
Risk: medium
Dependencies: Task 1

Files:
- Modify: frontend/app/page.tsx

Blast radius:
- frontend/app/page.tsx only (server component, no shared state)

Acceptance:
- Hero: full-width gradient bg, bold headline, subtitle, 2 CTA buttons (Mua key, Xem gói)
- Dark mode: animated gradient from #080B0F → #0D1F3C with subtle grid overlay
- Light mode: clean white hero with blue gradient accent band
- Neon glow on primary CTA button in dark mode
- Pricing section: cards with highlighted "popular" plan, feature list, token/duration display
- Features section: 3-col grid with icons
- Trust section: stats (users, uptime, tokens delivered)
- Fully responsive (mobile-first, sm/md/lg breakpoints)
- Geist font rendering correctly for all headings

TDD:
- Behavior: landing page renders without errors
- Test file: none (visual)
- Minimal GREEN change: rewrite page.tsx sections with new design
- Mocking: none

Steps:
1. GREEN: Rewrite frontend/app/page.tsx with new sections
2. VERIFY:
   - `cd frontend && yarn build`
   - `cd frontend && yarn lint`

Checkpoint:
- Files: `frontend/app/page.tsx`
- Commit: `feat(ui): redesign landing page with hero, pricing, features sections`

---

## Task 5: Auth pages redesign (login, register, forgot-password, reset-password, verify-email)
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: frontend/app/login/page.tsx
- Modify: frontend/app/register/page.tsx
- Modify: frontend/app/forgot-password/page.tsx
- Modify: frontend/app/reset-password/page.tsx
- Modify: frontend/app/verify-email/page.tsx

Blast radius:
- Auth flow unchanged (form submit logic kept as-is)

Acceptance:
- Split layout: left panel (brand, tagline, feature bullets) + right panel (form)
- Left panel: dark gradient bg with neon blue accent in dark; brand blue bg in light
- Left panel hidden on mobile (form takes full width)
- Form card: clean white in light, #111827 in dark
- Inputs: proper focus ring with brand color
- "Back to home" link at top-left
- Error states preserved (toast + field-level feedback)
- 2FA OTP step preserved in login
- All existing form logic (recaptcha, OTP, referral code) unchanged

TDD:
- Behavior: login form submits correctly, error states display
- Test file: none (logic unchanged)
- Minimal GREEN change: wrap existing form JSX in new split layout
- Mocking: none

Steps:
1. GREEN: Wrap each auth page in split layout shell, restyle form card
2. VERIFY:
   - `cd frontend && yarn build`
   - `cd frontend && yarn lint`

Checkpoint:
- Files: `frontend/app/login/page.tsx frontend/app/register/page.tsx frontend/app/forgot-password/page.tsx frontend/app/reset-password/page.tsx frontend/app/verify-email/page.tsx`
- Commit: `feat(ui): redesign auth pages with split-panel layout`

---

## Task 6: App sidebar redesign
Status: pending
Risk: medium
Dependencies: Task 1, Task 2, Task 3

Files:
- Modify: frontend/components/app-sidebar.tsx

Blast radius:
- frontend/app/(app)/layout.tsx (uses AppSidebar)

Acceptance:
- Sidebar header: logo icon + "cheapaikey" wordmark + ".store" muted suffix
- Active nav item: left border accent + bg highlight + glow on icon in dark mode
- Sidebar footer: user avatar with initials, name, email, dropdown with logout
- Group labels styled: uppercase, tracking-widest, smaller, muted
- Hover state: subtle bg transition
- SidebarRail preserved for collapse

TDD:
- Behavior: sidebar renders with brand logo and active state highlighting
- Test file: none
- Minimal GREEN change: update header JSX + add active glow className
- Mocking: none

Steps:
1. GREEN: Update app-sidebar.tsx header, active states, group labels
2. VERIFY:
   - `cd frontend && yarn lint`

Checkpoint:
- Files: `frontend/components/app-sidebar.tsx`
- Commit: `feat(ui): polish app sidebar with brand logo and neon active states`

---

## Task 7: Dashboard page polish
Status: pending
Risk: low
Dependencies: Task 1, Task 2, Task 6

Files:
- Modify: frontend/app/(app)/dashboard/page.tsx

Blast radius:
- frontend/app/(app)/dashboard/page.tsx only

Acceptance:
- KPI cards: gradient icon bg in dark, colored bg in light (not flat muted)
- Active key cards: neon blue glow border `shadow-[0_0_20px_rgba(20,133,255,0.25)]` in dark
- Token progress bar: gradient fill (blue → teal)
- "Chưa có key" empty state: illustrated icon + pulsing CTA button
- Section headers: consistent with new design language
- Admin pending alert: amber glow border in dark mode

TDD:
- Behavior: dashboard renders KPI cards and key cards correctly
- Test file: none
- Minimal GREEN change: update className on KPI cards, KeyCard, empty state
- Mocking: none

Steps:
1. GREEN: Update dashboard/page.tsx className tokens
2. VERIFY:
   - `cd frontend && yarn lint`

Checkpoint:
- Files: `frontend/app/(app)/dashboard/page.tsx`
- Commit: `feat(ui): polish dashboard KPI cards and key card glow states`

---

## Task 8: Buy page (pricing) redesign
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: frontend/app/(app)/dashboard/buy/page.tsx

Blast radius:
- frontend/app/(app)/dashboard/buy/page.tsx only

Acceptance:
- PlanCard: neon glow border on popular plan in dark mode
- Popular badge: gradient bg (blue → teal)
- Step indicator: glowing active dot
- Payment QR step: card with subtle bg, border highlight
- All existing buy flow logic unchanged

TDD:
- Behavior: plan cards render with new styles
- Test file: none
- Minimal GREEN change: update PlanCard className, popular badge
- Mocking: none

Steps:
1. GREEN: Update buy/page.tsx PlanCard and Steps components
2. VERIFY:
   - `cd frontend && yarn lint`

Checkpoint:
- Files: `frontend/app/(app)/dashboard/buy/page.tsx`
- Commit: `feat(ui): polish buy/pricing page with neon card styles`

---

## Task 9: My-keys page redesign
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: frontend/app/(app)/dashboard/my-keys/page.tsx

Blast radius:
- frontend/app/(app)/dashboard/my-keys/page.tsx only

Acceptance:
- KeyCard: neon glow border when active, muted when expired
- Status badge: correct colors per state (active=green, expiring=orange, expired=muted)
- Token bar: gradient fill
- Copy/refresh actions: icon buttons with hover glow
- Empty state: consistent with dashboard empty state

TDD:
- Behavior: key cards render with status-appropriate glow
- Test file: none
- Minimal GREEN change: update KeyCard className tokens
- Mocking: none

Steps:
1. GREEN: Update my-keys/page.tsx KeyCard styles
2. VERIFY:
   - `cd frontend && yarn lint`

Checkpoint:
- Files: `frontend/app/(app)/dashboard/my-keys/page.tsx`
- Commit: `feat(ui): polish my-keys page with status-aware glow styles`

---

## Environment Context
- **Language:** TypeScript 5 / React 19
- **Test command:** cd backend && yarn test
- **Linter command:** cd frontend && yarn lint
- **Formatter command:** cd frontend && yarn format (if exists) or cd backend && yarn format
- **Build command:** cd frontend && yarn build
- **Branch:** main
- **Conventional commit style:** `feat(ui):` / `fix(ui):`

**Codebase conventions:**
- All components: `'use client'` where needed, server components by default
- Imports: `@/` alias for frontend root
- Tailwind: v4 with CSS vars; `cn()` used inside `@/components/ui/` (shadcn); custom page components use template literals directly
- shadcn components: from `@/components/ui/`
- Admin pages (stats, users, orders, etc.) are out of scope for this redesign — not forgotten, intentionally deferred
- No test files for UI pages — visual verification via dev server
- next-themes: `ThemeProvider` from `'next-themes'`
- Tailwind dark: `@custom-variant dark (&:is(.dark *))` already in globals.css

**Graph Context:**
- Blast radius: 12 files total
- Hub nodes: globals.css (theme vars consumed everywhere), layout.tsx
- Bridge nodes: app-sidebar.tsx (shared across all app routes)
- Communities crossed: auth pages, dashboard pages, landing page
