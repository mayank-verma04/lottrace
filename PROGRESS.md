# LotTrace — Build Progress

## Current Status
**Phase:** Phase 0 — Foundation (Not Started)
**Last Updated:** — (project not yet started)
**Last Session:** Initial documentation setup complete

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
_Nothing yet — ready to start Phase 0_

---

## 📋 Phase 0 — Next Up (in order)

### Step 1: Project Scaffold
- [ ] Init monorepo with pnpm workspaces
- [ ] `backend/` — Express app scaffold (app.js, server.js, config/)
- [ ] `frontend/` — Vite React app scaffold
- [ ] `scan-pwa/` — Vite React PWA scaffold
- [ ] Docker Compose (postgres, redis)
- [ ] `.env.example` files for all services
- [ ] ESLint + Prettier config (shared)
- [ ] Husky pre-commit hooks

### Step 2: Database Foundation
- [ ] Knex setup + knexfile.js
- [ ] Migration: organizations table
- [ ] Migration: users table
- [ ] Migration: roles/permissions
- [ ] Migration: refresh_tokens table
- [ ] Seed: default roles, super_admin user
- [ ] PostgreSQL RLS policies

### Step 3: Auth Module (Backend)
- [ ] POST /api/v1/auth/register
- [ ] POST /api/v1/auth/login
- [ ] POST /api/v1/auth/refresh
- [ ] POST /api/v1/auth/logout
- [ ] POST /api/v1/auth/forgot-password
- [ ] POST /api/v1/auth/reset-password
- [ ] Auth middleware (JWT verify)
- [ ] RBAC middleware (role check)
- [ ] Tenant scope middleware

### Step 4: Org & User Management (Backend)
- [ ] GET/PATCH /api/v1/organizations/me
- [ ] GET/POST/PATCH/DELETE /api/v1/users
- [ ] POST /api/v1/users/invite
- [ ] Auth UI (login, register, forgot-password pages)
- [ ] User management UI

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
_None yet_

---

## 📌 Known Technical Debt
_Track items here as they're deferred_
