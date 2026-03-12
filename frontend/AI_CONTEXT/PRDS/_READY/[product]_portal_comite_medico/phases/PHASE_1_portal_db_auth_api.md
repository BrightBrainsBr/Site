# Portal Comitê Médico — Phase 1: Database + Auth + API Routes

**Cursor Agent:** /db-engineer + /backend-engineer
**Wave:** 0–1
**Objective:** Run DB migrations, create all API routes, and establish the portal feature module structure.
**Depends on:** None

**Files owned by this phase:**
- `frontend/app/api/portal/validate-code/route.ts`
- `frontend/app/api/portal/evaluations/route.ts`
- `frontend/app/api/portal/evaluations/[id]/route.ts`
- `frontend/app/api/portal/evaluations/[id]/approve/route.ts`
- `frontend/app/api/portal/evaluations/[id]/reject/route.ts`
- `frontend/features/portal/portal.interface.ts`
- `frontend/features/portal/constants/portal-theme.ts`
- `frontend/features/portal/constants/profile-options.ts`
- `frontend/features/portal/constants/form-sections.ts`
- `frontend/features/portal/helpers/format-evaluation.ts`

---

## 1. Files to Create

```
frontend/
├── app/api/portal/
│   ├── validate-code/route.ts
│   ├── evaluations/route.ts
│   └── evaluations/[id]/
│       ├── route.ts
│       ├── approve/route.ts
│       └── reject/route.ts
│
├── features/portal/
│   ├── portal.interface.ts
│   ├── constants/
│   │   ├── portal-theme.ts
│   │   ├── profile-options.ts
│   │   └── form-sections.ts
│   └── helpers/
│       └── format-evaluation.ts
```

---

## 2. What to Build

### Database Migrations (Wave 0)

Run via Supabase MCP `execute_sql` or Supabase CLI:

**Migration 1 — Add approval columns:**

```sql
ALTER TABLE public.mental_health_evaluations
  ADD COLUMN IF NOT EXISTS reviewer_status text DEFAULT 'pending_review'
    CHECK (reviewer_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewer_notes text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS form_data_history jsonb DEFAULT '[]'::jsonb;

UPDATE public.mental_health_evaluations
  SET reviewer_status = 'pending_review'
  WHERE reviewer_status IS NULL;
```

**Migration 2 — Rename professionals table:**

```sql
ALTER TABLE public.professionals RENAME TO bb_doctors;
```

**Migration 3 — Add portal access code:**

```sql
INSERT INTO public.assessment_access_codes (code, label, active)
VALUES ('PORTAL2026', 'Portal Comitê Médico', true);
```

### portal.interface.ts

Types for the portal feature:

```typescript
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export interface EvaluationListItem {
  id: string
  patient_name: string
  patient_profile: string | null
  patient_email: string | null
  created_at: string
  status: string
  reviewer_status: string
  report_pdf_url: string | null
  scores: Record<string, number> | null
}

export interface EvaluationDetail {
  id: string
  patient_name: string
  patient_email: string | null
  patient_cpf: string | null
  patient_phone: string | null
  patient_birth_date: string | null
  patient_sex: string | null
  patient_profile: string | null
  form_data: AssessmentFormData
  scores: Record<string, number> | null
  report_markdown: string | null
  report_pdf_url: string | null
  status: string
  reviewer_status: string
  reviewer_notes: string | null
  approved_at: string | null
  approved_by: string | null
  form_data_history: FormDataHistoryEntry[]
  created_at: string
}

export interface FormDataHistoryEntry {
  timestamp: string
  changed_by: string
  changed_fields: string[]
}

export type ReviewerStatus = 'pending_review' | 'approved' | 'rejected'
export type SortOption = 'date_desc' | 'date_asc' | 'name_asc'
```

### validate-code/route.ts

- **Pattern:** Same as `app/api/assessment/validate-code/route.ts`
- **Difference:** Queries `assessment_access_codes` table (not `avaliacao_codigo`). Checks `code` column and `active = true` and `label LIKE '%Portal%'`.
- **Cookie:** On valid code, set `portal_session` cookie with value = random UUID, httpOnly, secure, sameSite=strict, maxAge=86400 (24h). The cookie value itself is just a flag — no server-side session store needed since there are no user-specific permissions.

### evaluations/route.ts (GET)

- **Auth:** Check `portal_session` cookie exists. If not, return 401.
- **Query params:** `status`, `profile`, `search`, `sort` (all optional)
- **Query:** `SELECT id, patient_name, patient_profile, patient_email, created_at, status, reviewer_status, report_pdf_url, scores FROM mental_health_evaluations`
- **Filters:** `.eq('reviewer_status', status)` if provided, `.eq('patient_profile', profile)` if provided, `.ilike('patient_name', `%${search}%`)` if provided
- **Sort:** `.order('created_at', { ascending: sort === 'date_asc' })` or `.order('patient_name')` for `name_asc`. Default: `date_desc`
- **Response:** `EvaluationListItem[]`

### evaluations/[id]/route.ts (GET + PATCH)

**GET:**
- **Auth:** Check `portal_session` cookie
- **Query:** `SELECT * FROM mental_health_evaluations WHERE id = $id`
- **Response:** `EvaluationDetail`

**PATCH:**
- **Auth:** Check `portal_session` cookie
- **Body:** `{ form_data: Partial<AssessmentFormData>, scores?: Record<string, number>, changed_by?: string }`
- **Logic:**
  1. Read current row
  2. Deep-merge incoming `form_data` into existing `form_data`
  3. Append to `form_data_history`: `{ timestamp: new Date().toISOString(), changed_by, changed_fields: Object.keys(body.form_data) }`
  4. Update row with merged `form_data`, new `scores` (if provided), appended `form_data_history`
- **Response:** `{ success: true }`

### evaluations/[id]/approve/route.ts (POST)

- **Auth:** Check `portal_session` cookie
- **Body:** `{ approved_by: string }`
- **Runtime:** `nodejs`, `maxDuration: 300`
- **Logic:**
  1. Read current `form_data` and `scores` from DB
  2. Call `generateReportBackground(formData, scores, undefined, requestId)` — reuse existing function
  3. Call `buildPdf(formData, reportMarkdown)` — reuse existing function
  4. Upload PDF to Supabase Storage `assessment-pdfs` bucket (filename: `report_${id}_approved_${Date.now()}.pdf`)
  5. Update row: `report_markdown`, `report_pdf_url`, `reviewer_status = 'approved'`, `approved_at = now()`, `approved_by`
- **Response:** `{ success: true, report_pdf_url: string }`

### evaluations/[id]/reject/route.ts (POST)

- **Auth:** Check `portal_session` cookie
- **Body:** `{ reviewer_notes: string }`
- **Logic:** Update row: `reviewer_status = 'rejected'`, `reviewer_notes`
- **Response:** `{ success: true }`

### Constants & helpers

Copy values from PRD sections 9 and 10 directly:
- `portal-theme.ts` — color tokens
- `profile-options.ts` — profile + status badge configs
- `form-sections.ts` — section definitions mapping AssessmentFormData fields
- `format-evaluation.ts` — date formatting (`dd/MM/yyyy`), days ago helper, status label mapping

---

## 3. Integration Points

### Existing files to import from (NOT modify):

- `app/api/assessment/generate-pdf/pdf-helpers.ts` → `buildPdf()`
- `app/api/assessment/lib/generate-report-background.ts` → `generateReportBackground()`
- `features/assessment/components/assessment.interface.ts` → `AssessmentFormData`
- `features/assessment/helpers/compute-scores.ts` → `computeScores()` (for recalculating scores when form_data is edited)

### Cookie helper

Create a shared utility or inline the cookie check in each route. Pattern:

```typescript
import { cookies } from 'next/headers'

function isPortalAuthenticated(): boolean {
  const cookieStore = cookies()
  return !!cookieStore.get('portal_session')?.value
}
```

---

## 4. Phase Completion Checklist

- [ ] Migration: approval columns added to `mental_health_evaluations`
- [ ] Migration: `professionals` renamed to `bb_doctors`
- [ ] Migration: portal access code inserted
- [ ] File created: `features/portal/portal.interface.ts`
- [ ] File created: `features/portal/constants/portal-theme.ts`
- [ ] File created: `features/portal/constants/profile-options.ts`
- [ ] File created: `features/portal/constants/form-sections.ts`
- [ ] File created: `features/portal/helpers/format-evaluation.ts`
- [ ] File created: `app/api/portal/validate-code/route.ts`
- [ ] File created: `app/api/portal/evaluations/route.ts`
- [ ] File created: `app/api/portal/evaluations/[id]/route.ts`
- [ ] File created: `app/api/portal/evaluations/[id]/approve/route.ts`
- [ ] File created: `app/api/portal/evaluations/[id]/reject/route.ts`
- [ ] Tested: validate-code returns valid for 'PORTAL2026'
- [ ] Tested: evaluations list returns data from DB
- [ ] Tested: single evaluation returns full form_data

**Next:** `PHASE_2_portal_list_view.md` — Build the portal pages, code gate, and evaluation list view with filters.
