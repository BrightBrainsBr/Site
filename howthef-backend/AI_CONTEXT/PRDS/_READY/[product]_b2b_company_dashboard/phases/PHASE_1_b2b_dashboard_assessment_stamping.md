# Bright Precision B2B Company Dashboard — Phase 1: Assessment Stamping

**Cursor Agent:** /backend-engineer
**Wave:** 1
**Objective:** Modify validate-code to check company_access_codes, create pre-register API, modify submit to stamp evaluations with company context.
**Depends on:** Phase 0 (DB migration must be applied)

**Files owned by this phase:**
- `frontend/app/api/assessment/validate-code/route.ts` (modify)
- `frontend/app/api/assessment/pre-register/route.ts` (create)
- `frontend/app/api/assessment/submit/route.ts` (modify)

---

## 1. Files to Create

```
frontend/app/api/assessment/
├── validate-code/route.ts    # MODIFY
├── pre-register/
│   └── route.ts              # CREATE
└── submit/route.ts           # MODIFY
```

---

## 2. What to Build

### 2.1 `frontend/app/api/assessment/validate-code/route.ts`

**Purpose:** Validate access code from either `avaliacao_codigo` (open patient) or `company_access_codes` (B2B).

**Current behavior:** Only checks `avaliacao_codigo`, returns `{ valid: boolean }`.

**New behavior:**
1. Check `avaliacao_codigo` first (existing logic). If found → return `{ valid: true, type: 'open' }`.
2. If not found, check `company_access_codes` WHERE `code = trim(code)` AND `active = true`. If found → return:
   ```ts
   {
     valid: true,
     type: 'company',
     company_id: string,
     department: string | null,
     cycle_id: string,
     code_id: string
   }
   ```
3. If neither found → return `{ valid: false }`.

**Key details:**
- `company_access_codes.code` is the code column (not `codigo_verificacao` like avaliacao_codigo).
- Use Supabase service role client.
- Select: `id, company_id, department, cycle_id` from company_access_codes.

### 2.2 `frontend/app/api/assessment/pre-register/route.ts`

**Purpose:** Record employee name + email when they start a company-code assessment. Enables completion tracking.

**Request body:**
```ts
{ code_id: string; name: string; email: string }
```

**Logic:**
1. Validate `code_id`, `name`, `email` present. Return 400 if missing.
2. Lookup `company_access_codes` by `id = code_id`, `active = true`.
3. If not found or `used_at` already set → return 400.
4. Update row: `employee_email = email`, `started_at = now()` (if not already set).
5. Return `{ token: string }` — a simple signed/session token (e.g. base64 of `{ code_id, email }` or use a short-lived JWT). The frontend stores this and sends it with the submit request so the submit route can stamp the evaluation.

**Alternative (simpler):** Return `{ code_id, department, cycle_id, company_id }` — the frontend stores this in sessionStorage and includes it in the submit body. No crypto needed for MVP.

**Recommendation:** Return `{ code_id, company_id, department, cycle_id }` — client stores in sessionStorage, submit reads from request body.

### 2.3 `frontend/app/api/assessment/submit/route.ts`

**Purpose:** Submit evaluation. Add company stamping when B2B context is present.

**Current behavior:** Inserts into `mental_health_evaluations` with patient fields, form_data, scores, etc.

**New behavior:**
1. Accept optional fields in request body: `company_id`, `employee_department`, `cycle_id`, `code_id`.
2. If `company_id` is present:
   - Add to insert: `company_id`, `employee_department`, `cycle_id`.
   - After successful insert, if `code_id` present: update `company_access_codes` SET `used_at = now()`, `used_by_evaluation_id = evaluationId` WHERE `id = code_id`.
3. Preserve all existing logic (report generation, etc.).

**Key details:**
- The assessment form (or a wrapper) must send these fields when the user came from a company code flow. The form gets them from sessionStorage (set after pre-register response).
- Use a single Supabase transaction or sequential updates. If evaluation insert fails, do not update company_access_codes.

---

## 3. Database Migration

None. Uses tables from Phase 0.

---

## 4. Integration Points

| File | Change |
|------|--------|
| `frontend/features/assessment/*` | The assessment form/flow must: (1) On load with `?c=CODE`, call validate-code; if `type === 'company'`, show pre-registration step (name + email) before the 27-step form. (2) After pre-register, store `{ code_id, company_id, department, cycle_id }` in sessionStorage. (3) On submit, include these in the request body. |

**Note:** Phase 1 focuses on the API layer. The assessment form UI changes (pre-registration step, sessionStorage, submit payload) may be in a separate frontend phase or bundled with the assessment feature. This phase ensures the APIs are ready.

---

## 5. Phase Completion Checklist

- [ ] `validate-code` returns `{ valid, type?, company_id?, department?, cycle_id?, code_id? }` for company codes
- [ ] `validate-code` still returns `{ valid: true }` for open patient codes (no breaking change)
- [ ] `pre-register` route created, updates `employee_email` and `started_at`
- [ ] `submit` route stamps `company_id`, `employee_department`, `cycle_id` when provided
- [ ] `submit` updates `company_access_codes.used_at` and `used_by_evaluation_id` on success
- [ ] Manual test: company code flow end-to-end (validate → pre-register → submit with context)

**Next:** `PHASE_2_b2b_dashboard_auth_integration.md` — Auth callback/confirm rewrite, useB2BCompanyUser, empresa layout
