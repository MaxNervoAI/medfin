# Medfin V1 — Unified Action Plan to Production

**Date:** 2026-04-24 | **Epics:** 7 | **Est. Duration:** 8–10 weeks

---

## Global Rules
1. Mobile-First: Design for 390px first, scale up with `sm:`, `md:`, `lg:`.
2. No Inline Styles: Ban `style={{}}` for layout/responsive behavior. Use Tailwind only.
3. RLS Mandatory: New tables must have `auth.uid() = user_id` policies.
4. Zero Hardcoding: Tax rate must be dynamic from DB.

---

## Epic 1: PWA Foundation & Hardening
**Status:** ✅ COMPLETED (2026-04-24)
**Notes:** All items implemented. Skeleton components created in `components/ui/Skeleton.tsx` but not yet wired into pages — integration will happen during Epic 3 refactor. PWA icons (192x192, 512x512 PNGs) need to be generated and placed in `public/icons/`.

- [x] **E1.1** Install `next-pwa`, update `package.json`
- [x] **E1.2** Configure `next.config.mjs` with PWA settings
- [x] **E1.3** Create `public/manifest.json` (icons, theme, standalone)
- [x] **E1.4** Update `app/layout.tsx` with PWA meta tags (viewport, theme-color, apple-touch-icon)
- [x] **E1.5** Add React Error Boundary in layout
- [x] **E1.6** Add loading skeletons for Dashboard, Prestaciones, Instituciones

---

## Epic 2: Data Architecture & Tax Fix (BLOCKER)
**Status:** ✅ COMPLETED (2026-04-24)
**Notes:** Migration `002_tax_settings.sql` created with RLS policies. `getTaxRate()` helper added to `lib/utils.ts` with Supabase fetch + env fallback. `NuevaPrestacionForm.tsx` refactored to fetch rate dynamically on mount. Hardcoded `14.5` removed from codebase.

- [x] **E2.1** Create migration `002_tax_settings.sql`:
  - Table: `tax_settings(id, current_rate, valid_from, valid_to)`
  - Insert default: `current_rate = 0.145`
- [x] **E2.2** Add RLS: `SELECT` for auth users (global read-only config)
- [x] **E2.3** Refactor `NuevaPrestacionForm.tsx`: fetch rate from Supabase on mount, remove hardcoded `14.5`
- [x] **E2.4** Add `.env` fallback: `NEXT_PUBLIC_DEFAULT_TAX_RATE=0.145`

---

## Local Supabase Setup (Path B)
**Status:** ✅ COMPLETED (2026-04-24)
**Notes:** Local development environment configured. `supabase/config.toml`, `supabase/seed.sql`, `.env.local.example`, and `LOCAL_DEV_SETUP.md` created. Supabase CLI scripts added to `package.json`. This setup is fully isolated from any cloud Supabase project.

- [x] **LS.1** Create `supabase/config.toml` with local API/auth/studio ports
- [x] **LS.2** Create `supabase/seed.sql` with demo tax rate and institutions
- [x] **LS.3** Add `.env.local.example` with default local Supabase credentials
- [x] **LS.4** Add Supabase CLI scripts to `package.json`
- [x] **LS.5** Create `LOCAL_DEV_SETUP.md` quick-start guide
- [x] **LS.6** Update `.gitignore` for Supabase local files

---

## Epic 3: Mobile-First Refactor (CRITICAL BLOCKER)
**Status:** ✅ COMPLETED (2026-04-25)
**Notes:** All inline styles purged from target components. Tailwind responsiveness added to AppShell and Dashboard. MobileNav component created and integrated. Touch targets optimized to minimum 44px across all interactive elements.

- [x] **E3.1** Purge inline styles from:
  - `app/dashboard/DashboardClient.tsx`
  - `app/prestaciones/PrestacionesClient.tsx`
  - `app/instituciones/InstitucionesClient.tsx`
  - `app/presupuesto/PresupuestoClient.tsx`
  - `components/layout/AppShell.tsx`
- [x] **E3.2** Implement Tailwind responsiveness:
  - AppShell: `grid-cols-1 md:grid-cols-[248px_1fr]`
  - Dashboard stats: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - Replace all fixed pixel widths
- [x] **E3.3** Build Mobile Navigation:
  - Create `components/layout/MobileNav.tsx`
  - Fixed bottom bar on mobile (`md:hidden`), hide on desktop
  - Tabs: Dashboard, Prestaciones, Nueva, Instituciones, Presupuesto
- [x] **E3.4** Optimize touch targets: min 44px height/width on all interactive elements

---

## Epic 8: Design System Audit & shadcn Migration
**Status:** ✅ COMPLETED (2026-04-26)
**Notes:** Upgraded to Tailwind CSS v4 with CSS-first `@theme` configuration in `globals.css`. Reinstalled shadcn/ui with "new-york" style and stone base. Implemented full "Premium Medical-Finance" design system with OKLCH color tokens, Instrument Serif / Inter / JetBrains Mono fonts. All six main pages + AppShell + MobileNav refactored. Legacy uppercase UI components (`Button.tsx`, `Badge.tsx`, `Input.tsx`, `Select.tsx`) replaced by proper shadcn lowercase versions. Zero inline styles. Sonner toasts integrated. Build passes.

- [x] **E8.1** Design Audit: inventory and map custom components to shadcn equivalents
- [x] **E8.2** Tailwind v4 upgrade: `@tailwindcss/postcss` plugin, CSS-first `@theme` block, OKLCH palette
- [x] **E8.3** shadcn reinit: new-york style, stone base, all required components installed
- [x] **E8.4** Custom wrappers: `Money`, `StatCard`, `EmptyState`, `PageHeader`, `Wordmark`
- [x] **E8.5** AppShell + MobileNav rebrand with shadcn Button/Avatar/DropdownMenu
- [x] **E8.6** Login page rebrand
- [x] **E8.7** Dashboard rebrand: StatCard grid, Money values, bar chart, alerts
- [x] **E8.8** Prestaciones list rebrand: Tabs/Sheet/Badge, sonner toasts
- [x] **E8.9** PrestacionDetalle rebrand: SheetHeader, AlertDialog, Money, InfoRow
- [x] **E8.10** NuevaPrestacionForm rebrand: shadcn Card/Select/Input/Label/Alert/Textarea
- [x] **E8.11** InstitucionesClient rebrand: PageHeader, Card accordion, EmptyState
- [x] **E8.12** PresupuestoClient rebrand: hero Card, Progress bar, StatCard grid, EmptyState
- [x] **E8.13** Legacy CSS purged; `globals.css` uses only design tokens + minimal utilities

---

## Epic 4: Form & Input Optimization ("Friction Zero")
**Status:** Missing `inputMode="numeric"` on mobile keyboards.

- [ ] **E4.1** Add `inputMode="numeric"` + `pattern="[0-9]*"` to:
  - Monto bruto input
  - Horas input
  - Valor/hora input
  - Institution form numeric fields
- [ ] **E4.2** Verify net calculation uses dynamic tax rate from Epic 2

---

## Epic 5: State Machine & Data Management
**Status:** No edit flow, no boleta number, no month filter.

- [ ] **E5.1** Ensure lists are card-based (not HTML tables) — verify `PrestacionesClient.tsx`
- [ ] **E5.2** Add "Edit" flow for prestaciones:
  - Reuse `NuevaPrestacionForm` or create `EditPrestacionForm`
  - Pre-populate fields, update via Supabase
- [ ] **E5.3** Add boleta number input when transitioning to `boleta_emitida`
  - Field: `numero_boleta` (string)
  - Show in detail view
- [ ] **E5.4** Add month filter dropdown to cobranzas view

---

## Epic 6: Dashboard ("Anti-Ansiedad")
**Status:** Works but not responsive.

- [ ] **E6.1** Refactor 3 stat blocks to stack vertically on mobile, horizontal on desktop
- [ ] **E6.2** Ensure 6-month chart adapts width dynamically without viewport overflow
- [ ] **E6.3** Optimize alerts panel for mobile (full-width cards, touch-friendly)

---

## Epic 7: Proactive Alerts & Launch Prep
**Status:** API route exists but Resend/cron not configured.

- [ ] **E7.1** Configure Resend domain + verify DNS records
- [ ] **E7.2** Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to env vars
- [ ] **E7.3** Configure `vercel.json` with cron schedule for `/api/alertas-email`
- [ ] **E7.4** Verify CRON_SECRET protection on endpoint
- [ ] **E7.5** Add API rate limiting (e.g., `lru-cache` or Upstash Redis)
- [ ] **E7.6** Deploy to Vercel, link env vars, run end-to-end test

---

## Epic 9: Dashboard Alert Actions
**Status:** ✅ COMPLETED (2026-04-27)
**Notes:** Added quick-action functionality to dashboard alerts. Users can click alerts to open modal, emit boleta, mark paid, or snooze. Migration 003_alert_snooze.sql created. AlertActionModal component integrated with toast feedback and optimistic UI updates.

- [x] **E9.1** Create AlertActionModal component with Dialog
- [x] **E9.2** Define alert action logic (emit boleta, mark paid, snooze)
- [x] **E9.3** Implement snooze functionality with migration + generarAlertas update
- [x] **E9.4** Integrate AlertActionModal into DashboardClient
- [x] **E9.5** Add toast notifications and optimistic UI updates
- [x] **E9.6** Mobile optimization for modal
- [x] **E9.7** Database migration 003_alert_snooze.sql

---

## Execution Order

**Phase 1 (Weeks 1–3): Foundation**
- Epic 1 (PWA) + Epic 2 (Tax Fix) + Epic 4 (Input optimization)

**Phase 2 (Weeks 4–7): Mobile-First Refactor**
- Epic 3 (Responsive refactor) + Epic 6 (Dashboard refactor)

**Phase 3 (Weeks 8–9): Feature Completion**
- Epic 5 (Edit/Boleta/Filter) + remaining Epic 1 items (Skeletons, Error Boundaries)

**Phase 4 (Week 10): Launch Prep**
- Epic 7 (Resend/Cron/Deploy)

---

## Definition of Done (Overall)
- [ ] App installs as PWA on iOS Safari
- [ ] All pages usable on 390px width without horizontal scroll
- [ ] No inline `style={{}}` props remain in target files
- [ ] Tax rate changes in DB reflect immediately without redeploy
- [ ] All interactive elements ≥ 44px touch target
- [ ] E2E test passes: Login → Add Prestacion → Mark Boleta → Mark Pagada
- [ ] Cron emails send daily without errors
- [ ] Vercel deploy is live with env vars configured
