# Bright Precision B2B Company Dashboard — Phase 5a: Admin Company Management Backend

**Cursor Agent:** /backend-engineer
**Wave:** 3
**Objective:** Create all portal admin API routes for companies, invite-hr, codes, and cycles.
**Depends on:** Phase 0, Phase 2 (portal session pattern exists)

**Files owned by this phase:**
- `frontend/app/api/portal/companies/route.ts` (create)
- `frontend/app/api/portal/companies/[id]/route.ts` (create)
- `frontend/app/api/portal/companies/[id]/invite-hr/route.ts` (create)
- `frontend/app/api/portal/companies/[id]/codes/route.ts` (create)
- `frontend/app/api/portal/companies/[id]/cycles/route.ts` (create)
- `frontend/app/api/portal/lib/validatePortalSession.ts` (create or reuse)

---

## 1. Files to Create

```
frontend/app/api/portal/
├── lib/
│   └── validatePortalSession.ts     # CREATE or REUSE existing
└── companies/
    ├── route.ts                     # CREATE — GET list, POST create
    └── [id]/
        ├── route.ts                 # CREATE — GET, PATCH, DELETE
        ├── invite-hr/route.ts       # CREATE
        ├── codes/route.ts           # CREATE
        └── cycles/route.ts          # CREATE
```

---

## 2. What to Build

### 2.1 Portal Session Validation

**Purpose:** All portal admin routes use the existing doctor portal auth (e.g. `portal_session` httpOnly cookie or similar). Reuse the pattern from `frontend/app/api/portal/evaluations/route.ts` or `validate-code/route.ts`.

**Action:** If a shared `validatePortalSession` helper exists, use it. If not, create one that:
- Reads portal session from cookie/header
- Returns 401 if invalid
- Returns `{ valid: true }` or similar for use in route handlers

### 2.2 `frontend/app/api/portal/companies/route.ts`

**GET:** List all companies.
- Auth: portal session
- Query: `companies` table, select id, name, cnpj, contact_email, active, gro_issued_at, gro_valid_until, created_at
- Optionally join counts: evaluations per company, codes used/total
- Return `{ companies: [...] }`

**POST:** Create company.
- Auth: portal session
- Body: `{ name: string; cnpj?: string; contact_email?: string }`
- Insert into `companies`
- Create first `assessment_cycles` row: label "Jan–Jun {year}" or "Jul–Dez {year}" based on current date, `starts_at`, `ends_at`, `is_current = true`
- Return `{ id, name, ... }`

### 2.3 `frontend/app/api/portal/companies/[id]/route.ts`

**GET:** Company detail.
- Auth: portal session
- Select company by id
- Join: count of evaluations (WHERE company_id), count of codes (total, used)
- Return company + stats

**PATCH:** Update company.
- Auth: portal session
- Body: `{ name?, cnpj?, contact_email?, active?, gro_issued_at?, gro_valid_until? }`
- Update companies WHERE id
- Return updated company

**DELETE:** Soft-delete or hard-delete company.
- Auth: portal session
- Consider: cascade deletes (company_users, company_access_codes, assessment_cycles). Schema has ON DELETE CASCADE.
- Return 204 or { success }

### 2.4 `frontend/app/api/portal/companies/[id]/invite-hr/route.ts`

**POST:** Invite HR contact.
- Auth: portal session
- Body: `{ email: string }`
- Validate company exists
- Call `supabase.auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE_URL}/auth/confirm` })`
- Create `company_users` row: `user_id` = invited user's id (from invite response) or create with null user_id and link later via trigger — Supabase invite returns the created user. If async, create company_users with user_id from the invite response.
- Supabase `inviteUserByEmail` creates the user and sends email. The user may not exist until they click the link. Create `company_users` with `user_id` from the invite response — Supabase returns `{ data: { user } }`.
- Return `{ success: true }` or `{ error }`

**Note:** When using `inviteUserByEmail`, the user is created immediately in auth.users. Use that user.id for company_users.

### 2.5 `frontend/app/api/portal/companies/[id]/codes/route.ts`

**POST:** Generate codes.
- Auth: portal session
- Body: `{ department: string; count: number; employee_emails?: string[] }`
- Get current cycle for company
- Generate `count` unique codes (e.g. `{DEPT}-{4-digit}` or UUID-based)
- Insert into `company_access_codes` with company_id, cycle_id, department. If employee_emails provided, assign first N codes to those emails.
- Return `{ codes: [{ id, code, department, employee_email, shareable_url }] }` where `shareable_url = ${SITE_URL}/pt-BR/avaliacao?c=${code}`

**GET:** List codes or export CSV.
- Auth: portal session
- Query param: `format=csv` (optional)
- Select company_access_codes for company (and optionally cycle). Include started_at, used_at, employee_email.
- If format=csv: return CSV with columns: code, department, employee_email, shareable_url, started_at, used_at
- Else: return `{ codes: [...] }`

### 2.6 `frontend/app/api/portal/companies/[id]/cycles/route.ts`

**POST:** Create new cycle.
- Auth: portal session
- Body: `{ label: string; starts_at: string (date); ends_at: string (date) }`
- Set `is_current = true` for new cycle
- Update previous current cycle: SET `is_current = false` WHERE company_id AND is_current
- Insert new assessment_cycles row
- Return `{ id, label, starts_at, ends_at, is_current }`

---

## 3. Database Migration

None.

---

## 4. Integration Points

| File | Change |
|------|--------|
| `frontend/app/api/portal/evaluations/route.ts` or similar | Reuse portal session validation pattern. No modification if helper is extracted. |

---

## 5. Phase Completion Checklist

- [ ] GET /api/portal/companies returns list
- [ ] POST /api/portal/companies creates company + first cycle
- [ ] GET /api/portal/companies/[id] returns detail + stats
- [ ] PATCH /api/portal/companies/[id] updates company
- [ ] DELETE /api/portal/companies/[id] deletes company (cascade)
- [ ] POST /api/portal/companies/[id]/invite-hr sends invite, creates company_users
- [ ] POST /api/portal/companies/[id]/codes generates codes with shareable_url
- [ ] GET /api/portal/companies/[id]/codes returns list and CSV export
- [ ] POST /api/portal/companies/[id]/cycles creates new cycle, sets is_current

**Next:** `PHASE_5b_b2b_dashboard_admin_frontend.md` — Portal empresas pages and components
