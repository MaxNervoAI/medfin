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
**Status:** Tax rate hardcoded in `NuevaPrestacionForm.tsx:59` and schema.

- [ ] **E2.1** Create migration `002_tax_settings.sql`:
  - Table: `tax_settings(id, current_rate, valid_from, valid_to)`
  - Insert default: `current_rate = 0.145`
- [ ] **E2.2** Add RLS: `SELECT` for auth users (global read-only config)
- [ ] **E2.3** Refactor `NuevaPrestacionForm.tsx`: fetch rate from Supabase on mount, remove hardcoded `14.5`
- [ ] **E2.4** Add `.env` fallback: `NEXT_PUBLIC_DEFAULT_TAX_RATE=0.145`

---

## Epic 3: Mobile-First Refactor (CRITICAL BLOCKER)
**Status:** 5 files use inline styles. Zero responsive Tailwind prefixes exist.

- [ ] **E3.1** Purge inline styles from:
  - `app/dashboard/DashboardClient.tsx`
  - `app/prestaciones/PrestacionesClient.tsx`
  - `app/instituciones/InstitucionesClient.tsx`
  - `app/presupuesto/PresupuestoClient.tsx`
  - `components/layout/AppShell.tsx`
- [ ] **E3.2** Implement Tailwind responsiveness:
  - AppShell: `grid-cols-1 md:grid-cols-[240px_1fr]`
  - Dashboard stats: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - Replace all fixed pixel widths
- [ ] **E3.3** Build Mobile Navigation:
  - Create `components/layout/MobileNav.tsx`
  - Fixed bottom bar on mobile (`md:hidden`), hide on desktop
  - Tabs: Dashboard, Prestaciones, Nueva, Instituciones, Presupuesto
- [ ] **E3.4** Optimize touch targets: min 44px height/width on all interactive elements

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
