# LotTrace — Build Progress

## Current Status
**Phase:** Phase 1 — Trace Core / MVP (In Progress)
**Last Updated:** 2026-06-27
**Last Session:** Step 8 — Events CTEs + Hash Chain + Compliance Gaps

---

## Phase Overview
| Phase | Name | Weeks | Status |
|-------|------|-------|--------|
| 0 | Foundation | 1–3 | ✅ Complete |
| 1 | Trace Core (MVP) | 4–9 | 🔄 In Progress |
| 2 | Field-Ready | 10–14 | 🔲 Not Started |
| 3 | Scale & Integrate | 15–20 | 🔲 Not Started |
| 4 | Depth | 21+ | 🔲 Not Started |

---

## ✅ Completed

### Documentation (Pre-Build)
- [x] PRD reviewed and finalized
- [x] AGENTS.md (master AI context)
- [x] PROGRESS.md (this file)
- [x] docs/ARCHITECTURE.md
- [x] docs/TECH_STACK.md
- [x] docs/API_STANDARDS.md
- [x] docs/DATABASE_SCHEMA.md
- [x] docs/CONVENTIONS.md
- [x] docs/UI_DESIGN_SYSTEM.md
- [x] docs/FEATURE_MAP.md
- [x] docs/VALIDATION_RULES.md
- [x] backend/AGENTS.md
- [x] frontend/AGENTS.md
- [x] scan-pwa/AGENTS.md

---

## 🔄 In Progress
_Phase 1, Step 9 — Trace engine (recursive CTE forward/backward) coming next_

---

## 📋 Phase 0 — Next Up (in order)

### Phase 0: Project Foundation (Current)
- [x] **Step 1: Monorepo Scaffold** (backend, frontend, scan-pwa, shared configs)
- [x] Init monorepo with pnpm workspaces
- [x] `backend/` — Express app scaffold (app.js, server.js, config/)
- [x] `frontend/` — Vite React app scaffold
- [x] `scan-pwa/` — Vite React PWA scaffold
- [x] Docker Compose (postgres, redis)
- [x] `.env.example` files for all services
- [x] ESLint + Prettier config (shared)
- [x] Husky pre-commit hooks

### Step 2: Database Foundation
- [x] Knex setup + knexfile.js
- [x] Migration: organizations table
- [x] Migration: users table
- [x] Migration: roles/permissions
- [x] Migration: refresh_tokens table
- [x] Seed: default roles, super_admin user
- [x] PostgreSQL RLS policies

### Step 3: Auth Module (Backend)
- [x] POST /api/v1/auth/register
- [x] POST /api/v1/auth/login
- [x] POST /api/v1/auth/refresh
- [x] POST /api/v1/auth/logout
- [x] POST /api/v1/auth/forgot-password
- [x] POST /api/v1/auth/reset-password
- [x] Auth middleware (JWT verify)
- [x] RBAC middleware (role check)
- [x] Tenant scope middleware

### Step 4: Org & User Management (Backend)
- [x] GET/PATCH /api/v1/organizations/me
- [x] GET /api/v1/users (paginated, filterable)
- [x] GET /api/v1/users/:userId
- [x] POST /api/v1/users/invite
- [x] PATCH /api/v1/users/:userId
- [x] POST /api/v1/users/:userId/deactivate
- [x] POST /api/v1/users/:userId/reactivate
- [x] Reusable pagination utility

### Step 5: Auth UI + User Management UI (Frontend)
- [x] Auth UI (login, register, forgot-password pages)
- [x] User management UI
- [x] Organization settings page

### Step 6: Core Trace DB + Locations/Products (Phase 1 Start)
- [x] Migration: locations table
- [x] Migration: products table
- [x] Migration: lots table
- [x] Migration: events table (append-only, hash chain, generated column)
- [x] Migration: event_lot_links table
- [x] Migration: attachments table
- [x] Migration: audit_log table
- [x] RLS policies on all 7 new tables
- [x] Locations CRUD API (list, create, get, update, deactivate)
- [x] Products CRUD API (list, create, get, update)
- [x] KDE schema validation (nested Zod for custom_kde_schema)
- [x] Validate middleware upgraded (body + query + params)
- [x] Locations frontend pages (list + detail + create dialog)
- [x] Products frontend pages (list + detail + KDE schema builder)
- [x] React Query hooks for locations + products
- [x] Routes wired in App.jsx

### Step 7: Lots CRUD (Phase 1 Continued)
- [x] Lot CRUD API (list, create, get, update)
- [x] Lot void (POST /lots/:id/void)
- [x] Lots frontend pages (list + detail)
- [x] React Query hooks for lots
- [x] Routes wired in App.jsx
 
 ### Step 8: Events CTEs (Current)
 - [x] Event: Creation CTE
 - [x] Event: Receiving CTE
 - [x] Event: Transformation CTE (N inputs → M outputs)
 - [x] Event: Shipping CTE
 - [x] Event amend flow (supersedes_event_id)
 - [x] Event void flow
 - [x] Compliance gap detection on event save
 - [x] Hash chain: compute + store (record_hash, prev_hash)
 - [x] Audit log middleware (auditLogger.js)
 - [x] Record Event form (4 CTE types)
 - [x] Events API routes & React Query hooks

---

## 🚫 Blocked / Open Questions
- Pricing model not finalized (per-location vs per-event-volume vs flat tiers)
- Offline scanning scope (Phase 2 vs Phase 3 decision pending)
- Email provider chosen: Resend

---

## 💡 Architecture Decisions Log

| Date | Decision | Reason |
|------|---------|--------|
| Setup | Knex over Prisma | Recursive CTEs for trace engine, JS-first (no TS type gen), tighter SQL control |
| Setup | PostgreSQL only (no MongoDB) | JSONB covers flexible KDE payloads; avoids dual-DB complexity; recursive CTEs for trace |
| Setup | JavaScript not TypeScript | Team preference; JSDoc used for critical type hints |
| Setup | pnpm workspaces | Monorepo with shared configs |
| Setup | BullMQ for jobs | Redis-native, used anyway for caching; handles import/export/hash jobs |

---

## 🔗 Key Files Modified Last Session
- `backend/src/db/migrations/` — 7 new migration files (locations through audit_log)
- `backend/src/db/migrations/20240101000018_add_rls_policies.js` — expanded to all tenant tables
- `backend/src/modules/locations/` — 4 files (routes, controller, service, validation)
- `backend/src/modules/products/` — 4 files (routes, controller, service, validation)
- `backend/src/middleware/validate.js` — upgraded to support body+query+params
- `backend/src/app.js` — mounted locations + products routes
- `frontend/src/api/locations.api.js` — React Query hooks
- `frontend/src/api/products.api.js` — React Query hooks
- `frontend/src/api/lots.api.js` — React Query hooks
- `backend/src/modules/lots/` — 4 files (routes, controller, service, validation)
- `frontend/src/pages/locations/` — LocationsListPage, LocationDetailPage
- `frontend/src/pages/products/` — ProductsListPage, ProductDetailPage
- `frontend/src/pages/lots/` — LotsListPage, LotDetailPage
- `frontend/src/App.jsx` — wired new routes
- `backend/src/utils/hashChain.js` — [NEW] Hash chain logic for events
- `backend/src/utils/auditTrail.js` — [NEW] Helper to write to audit_log
- `backend/src/middleware/auditLogger.js` — [NEW] Audit log middleware
- `backend/src/modules/events/` — [NEW] Events module (routes, controller, service, validation)
- `backend/src/app.js` — Mounted events router
- `frontend/src/api/events.api.js` — [NEW] Event React Query hooks
- `frontend/src/pages/events/RecordEventPage.jsx` — [NEW] CTE event recording form

---

## 📌 Known Technical Debt
_Track items here as they're deferred_
