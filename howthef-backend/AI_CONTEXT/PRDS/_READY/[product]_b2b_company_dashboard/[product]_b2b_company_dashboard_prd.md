# Bright Precision B2B Company Dashboard — PRD

**Version:** 1.0
**Date:** 18 Mar 2026
**Status:** Implementation Ready

---

## 1. Overview

This PRD specifies the implementation of the Bright Precision B2B Company Dashboard — a self-service HR portal where company clients view aggregated, anonymized cognitive health data for their workforce. It solves the problem of manual report compilation and NR-1 compliance documentation by linking assessments to companies via codes, stamping evaluations at submit time, and exposing KPIs through a dedicated dashboard. The architecture reuses the existing Next.js 15 + Supabase stack; no new infrastructure is required. Reference: `[product]_b2b_company_dashboard_strategy.md`.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BRIGHT PRECISION B2B FLOWS                               │
├────────────────────────────┬────────────────────────────┬────────────────────────┤
│  B2B HR DASHBOARD          │  EMPLOYEE ASSESSMENT       │  ADMIN (Portal)        │
│  /[locale]/empresa/*        │  /[locale]/avaliacao       │  /[locale]/portal/*    │
├────────────────────────────┼────────────────────────────┼────────────────────────┤
│                            │                            │                        │
│  layout.tsx                │  ?c=CODE on load            │  PortalHeaderComponent  │
│    └─ Session guard        │    └─ validate-code        │    └─ + Empresas link   │
│    └─ useB2BCompanyUser    │    └─ pre-register (name+  │                        │
│                            │       email) if company    │  /portal/empresas       │
│  login/page.tsx            │    └─ 27-step form         │    └─ CompanyManager   │
│    └─ B2BLoginComponent    │    └─ submit stamps        │    └─ CodeGenerator    │
│    └─ Supabase Auth        │       company_id, dept,    │                        │
│                            │       cycle_id             │  /api/portal/companies │
│  dashboard/page.tsx        │                            │    └─ CRUD + invite-hr  │
│    └─ B2BDashboardComponent│  /api/assessment/         │    └─ codes, cycles    │
│    └─ 5 tabs + cycle sel   │    validate-code (MOD)     │                        │
│                            │    pre-register (NEW)      │                        │
│  GET /api/b2b/me           │    submit (MOD)            │                        │
│  GET /api/b2b/[id]/*       │                            │                        │
│    overview, departments   │                            │                        │
│    domains, compliance     │                            │                        │
│    alerts                  │                            │                        │
└────────────────────────────┴────────────────────────────┴────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  AUTH LAYER                                                                      │
│  frontend/auth/callback/route.ts  → company_users lookup → /empresa/dashboard     │
│  frontend/auth/confirm/route.ts   → same logic for invite confirmation           │
│  frontend/auth/auth.interface.ts  → UserType: 'company_hr'                       │
│  frontend/auth/services_and_hooks/useB2BCompanyUser.ts → GET /api/b2b/me          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SUPABASE                                                                        │
│  auth.users | companies | assessment_cycles | company_users | company_access_codes│
│  mental_health_evaluations (+ company_id, employee_department, cycle_id)          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Principles & Architecture Decisions

1. **Invite-only B2B auth.** No self-signup. Bright Brains creates companies and invites HR via `supabase.auth.admin.inviteUserByEmail()`. WHY: Controlled access, zero unauthorized signups.

2. **Link-based assessment entry.** Employees click `/avaliacao?c=CODE` — no code typing. Pre-registration captures name + email before the form. WHY: Better UX, completion tracking (`started_at` vs `used_at`).

3. **Two code tables.** `avaliacao_codigo` (open patient) and `company_access_codes` (B2B). Same `/avaliacao` route handles both. Company codes trigger pre-registration; open codes skip it. WHY: No regression for existing flows.

4. **Semiannual cycles.** `assessment_cycles` per company. Evaluations tagged with `cycle_id`. HR switches cycles in the dashboard. WHY: NR-1 and reporting require period-based views.

5. **Anonymization by design.** Dashboard never exposes names, CPFs, emails. Employees rendered as `COL-XXXX`. WHY: LGPD compliance.

6. **No external benchmarks in MVP.** Benchmark fields show "–" or "em construção". WHY: Requires internal sample mass; defer to post-MVP.

---

## 4. Directory Structure

```
frontend/
├── app/
│   ├── [locale]/
│   │   ├── empresa/                              # B2B HR dashboard — NEW
│   │   │   ├── layout.tsx                        # Session guard + company check
│   │   │   ├── page.tsx                          # Root: redirect to dashboard or login
│   │   │   ├── login/
│   │   │   │   └── page.tsx                      # HR login (email + password)
│   │   │   └── dashboard/
│   │   │       └── page.tsx                      # Protected dashboard shell
│   │   └── portal/
│   │       └── empresas/                         # Admin company management — NEW
│   │           ├── page.tsx                      # Company list
│   │           └── [id]/
│   │               └── page.tsx                  # Company detail + codes + cycles
│   └── api/
│       ├── b2b/
│       │   ├── me/route.ts                        # { company_id, company_name, cycles, current_cycle }
│       │   └── [companyId]/
│       │       ├── overview/route.ts             # KPIs + risk distribution
│       │       ├── departments/route.ts          # Per-dept breakdown
│       │       ├── domains/route.ts              # 13 cognitive domain averages
│       │       ├── compliance/route.ts           # NR-1 status, GRO, coverage
│       │       └── alerts/route.ts               # Anonymized risk alerts
│       ├── portal/
│       │   └── companies/
│       │       ├── route.ts                      # GET list, POST create
│       │       └── [id]/
│       │           ├── route.ts                  # GET, PATCH, DELETE
│       │           ├── invite-hr/route.ts        # POST invite HR
│       │           ├── codes/route.ts            # POST generate, GET list/CSV
│       │           └── cycles/route.ts            # POST create cycle
│       └── assessment/
│           ├── validate-code/route.ts            # MODIFY: + company_access_codes
│           ├── pre-register/route.ts             # NEW: employee_email + started_at
│           └── submit/route.ts                    # MODIFY: stamp company_id, etc.
├── auth/                                         # Supabase Auth — MODIFY
│   ├── callback/route.ts                         # MODIFY: company_users → /empresa/dashboard
│   ├── confirm/route.ts                          # MODIFY: same
│   ├── auth.interface.ts                        # MODIFY: UserType + 'company_hr'
│   ├── signin/page.tsx                           # MODIFY: redirect → /empresa/login
│   ├── signup/page.tsx                           # MODIFY: invite-only message
│   ├── signout/page.tsx                           # MODIFY: redirect → /empresa/login
│   ├── update-password/page.tsx                  # MODIFY: redirect → /empresa/login
│   └── services_and_hooks/
│       ├── authService.ts                        # MODIFY: redirect paths
│       ├── useB2BCompanyUser.ts                   # NEW: GET /api/b2b/me
│       └── useUserRoles.ts                        # DELETE
└── features/
    ├── b2b-dashboard/
    │   ├── components/
    │   │   ├── B2BLoginComponent.tsx
    │   │   ├── B2BDashboardComponent.tsx
    │   │   ├── B2BHeaderComponent.tsx
    │   │   ├── B2BKpiRowComponent.tsx
    │   │   └── tabs/
    │   │       ├── B2BOverviewTab.tsx
    │   │       ├── B2BRiskMapTab.tsx
    │   │       ├── B2BDomainsTab.tsx
    │   │       ├── B2BComplianceTab.tsx
    │   │       └── B2BAlertsTab.tsx
    │   ├── hooks/
    │   │   ├── useB2BSession.ts
    │   │   ├── useB2BOverview.ts
    │   │   ├── useB2BDepartments.ts
    │   │   ├── useB2BDomains.ts
    │   │   ├── useB2BCompliance.ts
    │   │   └── useB2BAlerts.ts
    │   └── b2b-dashboard.interface.ts
    └── portal/
        └── components/
            ├── PortalHeaderComponent.tsx         # MODIFY: + Empresas nav link
            ├── CompanyManagerComponent.tsx       # NEW
            └── CompanyCodeGeneratorComponent.tsx # NEW
```

---

## 5. Service & Component Specifications

### 5.1 API Routes

| File | Purpose | Key Logic |
|------|---------|-----------|
| `frontend/app/api/assessment/validate-code/route.ts` | Validate code (open or company) | Check `avaliacao_codigo` first; if not found, check `company_access_codes`. Return `{ valid, type?, company_id?, department?, cycle_id?, code_id? }` |
| `frontend/app/api/assessment/pre-register/route.ts` | Pre-register employee for company code | Body: `{ code_id, name, email }`. Update `company_access_codes.employee_email`, `started_at`. Return session token. |
| `frontend/app/api/assessment/submit/route.ts` | Submit evaluation | If `company_id`, `employee_department`, `cycle_id` in body/session, stamp evaluation. Update `company_access_codes.used_at`, `used_by_evaluation_id`. |
| `frontend/app/api/b2b/me/route.ts` | Resolve company for authenticated user | `getUser()` → `company_users` JOIN `companies` → `{ company_id, company_name, role, cycles[], current_cycle }` |
| `frontend/app/api/b2b/[companyId]/overview/route.ts` | KPIs for cycle | Verify `company_users.company_id == companyId`. Query `mental_health_evaluations` WHERE `company_id` AND `cycle_id`. Aggregate: total, avg score, risk dist, burnout. |
| `frontend/app/api/b2b/[companyId]/departments/route.ts` | Per-dept breakdown | Same auth. Group by `employee_department`. Per dept: n, avg score, risk breakdown, trend vs previous cycle. |
| `frontend/app/api/b2b/[companyId]/domains/route.ts` | 13 cognitive domain averages | Same auth. Extract from `scores` jsonb. No external benchmark in MVP. |
| `frontend/app/api/b2b/[companyId]/compliance/route.ts` | NR-1 compliance | Same auth. `reviewer_status = 'approved'` count / total. GRO from `companies.gro_issued_at`, `gro_valid_until`. |
| `frontend/app/api/b2b/[companyId]/alerts/route.ts` | Anonymized alerts | Same auth. High/critical risk evals. Return `COL-{hash}` IDs, no PII. |
| `frontend/app/api/portal/companies/route.ts` | List/create companies | Portal session auth. GET: list. POST: create + first cycle. |
| `frontend/app/api/portal/companies/[id]/route.ts` | Company CRUD | GET, PATCH, DELETE. |
| `frontend/app/api/portal/companies/[id]/invite-hr/route.ts` | Invite HR | POST `{ email }`. `supabase.auth.admin.inviteUserByEmail()`. Create `company_users` row. |
| `frontend/app/api/portal/companies/[id]/codes/route.ts` | Codes CRUD | POST: generate batch. GET: list + CSV export with `shareable_url`. |
| `frontend/app/api/portal/companies/[id]/cycles/route.ts` | Create cycle | POST `{ label, starts_at, ends_at }`. Set `is_current`, unset previous. |

### 5.2 Auth Modifications

| File | Purpose | Key Changes |
|------|---------|-------------|
| `frontend/auth/callback/route.ts` | OAuth/code callback | Remove `admins`, `university_users`, `learners`. Add `company_users` lookup → redirect `/empresa/dashboard`. Keep recovery flow. |
| `frontend/auth/confirm/route.ts` | Invite confirmation | Same: `company_users` → `/empresa/dashboard`. Else `/empresa/login?error=unauthorized`. |
| `frontend/auth/auth.interface.ts` | Types | `UserType`: add `'company_hr'`, remove Mindless types. |
| `frontend/auth/services_and_hooks/useB2BCompanyUser.ts` | Company resolution | TanStack Query → `GET /api/b2b/me`. Returns `{ company_id, company_name, current_cycle, cycles[], isCompanyUser }`. |

### 5.3 Frontend Components

| File | Purpose | Key Props/Signatures |
|------|---------|----------------------|
| `B2BLoginComponent.tsx` | Email + password form | `view='sign_in'`, `hideProviders=true`. On success → `/empresa/dashboard`. |
| `B2BDashboardComponent.tsx` | Tab shell + header | Tabs: overview, risk, domains, compliance, alerts. Cycle selector in header. |
| `B2BHeaderComponent.tsx` | Company name, cycle selector, NR-1 badge | `companyName`, `cycles`, `currentCycle`, `onCycleChange`. |
| `B2BKpiRowComponent.tsx` | 5 KPI cards | `kpis: { total, avgScore, critical, elevated, ... }` |
| `B2BOverviewTab.tsx` | Visão Geral | Trend chart, donut, dept risk bars. Uses `useB2BOverview`. |
| `B2BRiskMapTab.tsx` | Mapa de Risco | Dept table, hierarchy chart. Uses `useB2BDepartments`. |
| `B2BDomainsTab.tsx` | Domínios Cognitivos | Bar chart, critical/strong domains. Uses `useB2BDomains`. |
| `B2BComplianceTab.tsx` | Conformidade NR-1 | Checklist, timeline, GRO cards. Uses `useB2BCompliance`. |
| `B2BAlertsTab.tsx` | Alertas & Prioridades | Risk cards with COL-XXXX. Uses `useB2BAlerts`. |
| `CompanyManagerComponent.tsx` | Admin: list + create | List companies, create form. |
| `CompanyCodeGeneratorComponent.tsx` | Admin: generate codes | Dept + count + optional emails. Export CSV with shareable URLs. |

### 5.4 Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useB2BSession.ts` | Session + company_id | `{ session, companyId, isCompanyUser }` |
| `useB2BOverview.ts` | TanStack Query | `useQuery` → `/api/b2b/[id]/overview?cycle=` |
| `useB2BDepartments.ts` | TanStack Query | `useQuery` → `/api/b2b/[id]/departments?cycle=` |
| `useB2BDomains.ts` | TanStack Query | `useQuery` → `/api/b2b/[id]/domains?cycle=` |
| `useB2BCompliance.ts` | TanStack Query | `useQuery` → `/api/b2b/[id]/compliance?cycle=` |
| `useB2BAlerts.ts` | TanStack Query | `useQuery` → `/api/b2b/[id]/alerts?cycle=` |

---

## 6. API Endpoints

### B2B Dashboard (Supabase JWT)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/b2b/me` | JWT | — | `{ company_id, company_name, role, cycles[], current_cycle }` |
| GET | `/api/b2b/[companyId]/overview` | JWT | `?cycle=uuid` | `{ total, avgScore, riskDistribution, burnoutIndex, ... }` |
| GET | `/api/b2b/[companyId]/departments` | JWT | `?cycle=uuid` | `{ departments: [{ name, n, avgScore, riskBreakdown, trend }] }` |
| GET | `/api/b2b/[companyId]/domains` | JWT | `?cycle=uuid` | `{ domains: [{ name, avg }] }` |
| GET | `/api/b2b/[companyId]/compliance` | JWT | `?cycle=uuid` | `{ groStatus, groIssuedAt, groValidUntil, coveragePct, ... }` |
| GET | `/api/b2b/[companyId]/alerts` | JWT | `?cycle=uuid` | `{ alerts: [{ id: 'COL-XXXX', riskLevel, domain, ... }] }` |

### Assessment (no auth)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/assessment/validate-code` | `{ code }` | `{ valid, type?, company_id?, department?, cycle_id?, code_id? }` |
| POST | `/api/assessment/pre-register` | `{ code_id, name, email }` | `{ token }` |

### Portal Admin (portal_session)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/portal/companies` | — | `{ companies: [...] }` |
| POST | `/api/portal/companies` | `{ name, cnpj, contact_email }` | `{ id, ... }` |
| GET | `/api/portal/companies/[id]` | — | Company detail + stats |
| PATCH | `/api/portal/companies/[id]` | `{ name?, cnpj?, gro_issued_at?, ... }` | Updated company |
| POST | `/api/portal/companies/[id]/invite-hr` | `{ email }` | `{ success }` |
| POST | `/api/portal/companies/[id]/codes` | `{ department, count, employee_emails? }` | `{ codes: [...] }` |
| GET | `/api/portal/companies/[id]/codes` | `?format=csv` | List or CSV |
| POST | `/api/portal/companies/[id]/cycles` | `{ label, starts_at, ends_at }` | `{ id, ... }` |

---

## 7. Database Schema

Reference: Strategy doc section 7. Full SQL below.

```sql
-- companies
CREATE TABLE companies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  cnpj             text UNIQUE,
  contact_email    text,
  active           boolean NOT NULL DEFAULT true,
  gro_issued_at    timestamptz,
  gro_valid_until  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- assessment_cycles
CREATE TABLE assessment_cycles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  label        text NOT NULL,
  starts_at    date NOT NULL,
  ends_at      date NOT NULL,
  is_current   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cycles_company_idx ON assessment_cycles(company_id);
CREATE UNIQUE INDEX cycles_one_current ON assessment_cycles(company_id) WHERE is_current = true;

-- company_users
CREATE TABLE company_users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'viewer',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
CREATE INDEX company_users_user_idx ON company_users(user_id);
CREATE INDEX company_users_company_idx ON company_users(company_id);

-- company_access_codes
CREATE TABLE company_access_codes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id                uuid NOT NULL REFERENCES assessment_cycles(id),
  code                    text UNIQUE NOT NULL,
  department              text,
  employee_email          text,
  started_at              timestamptz,
  used_at                 timestamptz,
  used_by_evaluation_id   uuid REFERENCES mental_health_evaluations(id),
  active                  boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_access_codes_code_idx ON company_access_codes(code);
CREATE INDEX company_access_codes_company_idx ON company_access_codes(company_id);

-- Extend mental_health_evaluations
ALTER TABLE mental_health_evaluations
  ADD COLUMN company_id          uuid REFERENCES companies(id),
  ADD COLUMN employee_department text,
  ADD COLUMN cycle_id            uuid REFERENCES assessment_cycles(id);
CREATE INDEX mhe_company_id_idx ON mental_health_evaluations(company_id);
CREATE INDEX mhe_cycle_id_idx   ON mental_health_evaluations(cycle_id);

-- RLS
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company memberships"
  ON company_users FOR SELECT USING (auth.uid() = user_id);
```

---

## 8. Configuration & Constants

| Env Var | Purpose |
|---------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side API routes |
| `SITE_URL` | Base URL for shareable links (e.g. `https://app.brightbrains.com`) |

### Constants (in code)

| Constant | Value | Purpose |
|----------|-------|---------|
| Risk thresholds | `< 45` Crítico, `45–59` Elevado, `60–69` Moderado, `≥ 70` Baixo | Score classification |
| Anonymization prefix | `COL-` | Pseudonymous ID prefix |
| Shareable URL format | `{SITE_URL}/pt-BR/avaliacao?c={code}` | Link in CSV export |

---

## 9. Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| API routes | Try/catch. Return `NextResponse.json({ error })` with appropriate status (400, 401, 404, 500). Log server-side. |
| B2B auth | 401 if no session or `company_users` lookup fails. Redirect to `/empresa/login?error=unauthorized`. |
| Assessment validate-code | Return `{ valid: false }` for invalid/expired codes. No 500 for expected failures. |
| Pre-register | 400 if `code_id` invalid or code already used. |
| Submit | Existing error handling preserved. Add company stamping only when context present. |
| TanStack Query | `retry: 1`, `staleTime` per hook. Show loading/error states in UI. |

---

## 10. Implementation Order

1. **Phase 0** — DB migration: `companies`, `assessment_cycles`, `company_users`, `company_access_codes`, ALTER `mental_health_evaluations`, indexes, RLS.
2. **Phase 1** — Assessment stamping: modify `validate-code`, create `pre-register`, modify `submit`.
3. **Phase 2** — Auth integration: modify callback/confirm/interface, create `useB2BCompanyUser`, empresa layout + login + dashboard pages.
4. **Phase 3** — B2B aggregation APIs: `/api/b2b/me` + 5 `[companyId]/*` endpoints.
5. **Phase 4** — B2B dashboard frontend: all empresa pages, `features/b2b-dashboard/*`, hooks.
6. **Phase 5a** — Admin backend: `/api/portal/companies/*` routes.
7. **Phase 5b** — Admin frontend: `/portal/empresas` pages, CompanyManager, CompanyCodeGenerator, PortalHeader nav.

---

## 11. Dependencies

| Dependency | Purpose |
|------------|---------|
| `@supabase/supabase-js` | Auth, DB client |
| `@tanstack/react-query` | Server state |
| `chart.js` / `react-chartjs-2` | Dashboard charts (or existing chart lib) |
| Existing: `frontend/auth/*` | Auth plumbing |
| Existing: `frontend/app/api/assessment/*` | Validate, submit |
| Existing: `frontend/features/portal/*` | Portal layout, nav |
| Existing: `frontend/app/api/portal/validate-code` | Portal session — unchanged |

---

## 12. Future Enhancements

- External benchmark data (sector benchmarks)
- PDF export of dashboard (server-generated)
- Holdings/subsidiary hierarchy
- Multiple HR users per company with roles
- Automatic GRO status based on coverage threshold
