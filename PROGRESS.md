# LotTrace — Build Progress

## Current Status
**Phase:** Phase 0 — Foundation (In Progress)
**Last Updated:** 2026-06-26
**Last Session:** Step 4 — Org & User Management backend complete

---

## Phase Overview
| Phase | Name | Weeks | Status |
|-------|------|-------|--------|
| 0 | Foundation | 1–3 | 🔲 Not Started |
| 1 | Trace Core (MVP) | 4–9 | 🔲 Not Started |
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
_Step 5: Auth UI + User Management UI — next up_

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
- [ ] Auth UI (login, register, forgot-password pages)
- [ ] User management UI
- [ ] Organization settings page

---

## 🚫 Blocked / Open Questions
- Pricing model not finalized (per-location vs per-event-volume vs flat tiers)
- Offline scanning scope (Phase 2 vs Phase 3 decision pending)
- Email provider not chosen (Resend vs SendGrid vs SES)

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
- `backend/src/modules/organizations/` — 4 files (validation, service, controller, routes)
- `backend/src/modules/users/` — 4 files (validation, service, controller, routes)
- `backend/src/utils/pagination.js` — reusable pagination helper
- `backend/src/app.js` — registered org + user routes

---

## 📌 Known Technical Debt
_Track items here as they're deferred_
