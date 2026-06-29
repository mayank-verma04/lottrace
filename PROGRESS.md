# LotTrace — Build Progress

## Current Status
**Phase:** Phase 1 — Trace Core / MVP (Complete)
**Last Updated:** 2026-06-28
**Last Session:** Phase 1 Final Polish (UI wiring & fixes)

---

## Phase Overview
| Phase | Name | Weeks | Status |
|-------|------|-------|--------|
| 0 | Foundation | 1–3 | ✅ Complete |
| 1 | Trace Core (MVP) | 4–9 | ✅ Complete |
| 2 | Field-Ready | 10–14 | 🔲 Not Started |
| 3 | Scale & Integrate | 15–20 | 🔲 Not Started |
| 4 | Depth | 21+ | 🔲 Not Started |

---

## ✅ Completed

---

## 🔄 In Progress
_Phase 2, Step 14 — Recall Simulation UI, Dashboard stats UI coming next_

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

### Step 9: Trace Engine
 - [x] Trace engine: forward trace (recursive CTE)
 - [x] Trace engine: backward trace (recursive CTE)
 - [x] Trace engine: full trace (forward + backward, deduplicated)
 - [x] Trace result caching (Redis, 5min TTL)
 - [x] Cache invalidation on event creation
 - [x] Trace API routes (GET /trace/:lotId/forward|backward|full)
 - [x] Trace React Query hooks
 - [x] Trace visualization page (table view + tree view)
 - [x] Routes wired in App.jsx

### Step 10: Events List & Audit Log (Phase 1 Complete)
 - [x] Audit backend module (routes, controller, service, validation)
 - [x] GET /api/v1/audit endpoint with pagination and filtering
 - [x] Audit API React Query hooks
 - [x] AuditLogPage (DataTable with filters)
 - [x] EventsListPage (DataTable)
 - [x] Mount routes in App.jsx and backend app.js

### Step 10.5: Phase 1 Final Polish
 - [x] Reports backend (GET compliance gaps, POST export csv)
 - [x] Jobs queue (BullMQ) & worker (export-generator)
 - [x] Storage util for AWS S3
 - [x] Attachment support in Events module
 - [x] ComplianceGapsPage UI
 - [x] CSV Export Button on Events and Audit logs
 - [x] Attachment upload on RecordEventPage

### Step 11: Phase 2 Foundation & PWA Init
 - [x] DB migrations: imports, recall_simulations, notifications, idempotency_keys
 - [x] Scan PWA: camera scanning (@zxing/library)
 - [x] Scan PWA: scan → lookup lot → attach to event flow scaffold
 - [x] PWA manifest + service worker (vite-plugin-pwa)

### Step 12: Scan PWA Features & Bulk Import API
 - [x] Scan PWA: bulk scan mode (sequential receiving)
 - [x] Scan PWA: GS1-128 parsing
 - [x] Scan PWA: create new lot from unknown scan
 - [x] Bulk CSV import API (POST /imports)
 - [x] Import background job (import-processor.js)
 - [x] ImportPage UI

### Step 13: Recall API & Dashboard Stats
 - [x] Recall simulation API (POST /recall/simulations)
 - [x] Recall simulation storage + retrieval
 - [x] Dashboard stats endpoint (GET /dashboard/stats)
 - [x] Dashboard recent activity feed (GET /dashboard/activity)

---

## 🚫 Blocked / Open Questions
- Pricing model not finalized (per-location vs per-event-volume vs flat tiers)
- Offline scanning scope (Phase 2 vs Phase 3 decision pending)

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
- `backend/src/modules/recall/*` — Added recall simulation API
- `backend/src/modules/dashboard/*` — Added dashboard stats and activity feed API
- `backend/src/app.js` — Mounted recall and dashboard routes

---

## 📌 Known Technical Debt
_Track items here as they're deferred_
