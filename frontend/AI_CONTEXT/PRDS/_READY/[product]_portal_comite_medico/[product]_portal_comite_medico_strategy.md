# Portal Comitê Médico — Strategy PRD

**Version:** 1.0
**Date:** 2026-03-12
**Author:** Oliver + AI
**Status:** Strategy Draft — Refine before implementation detail

---

> **Your doctors are reviewing AI-generated reports via WhatsApp and manually editing PDFs. The Portal Comitê Médico gives the medical committee a secure internal interface to view, edit, approve, and regenerate patient reports — turning a 20-minute manual process into a 2-minute workflow.**

---

## 1. The Problem

The Bright Precision product is live and collecting real patient evaluations (20+ completed). The AI generates reports and PDFs, emails them to the clinic. Then:

- Fernando receives the email, forwards the PDF to Dr. Soraya via WhatsApp
- Dr. Soraya reads the PDF, wants to change a phrase or two
- She communicates edits back via WhatsApp text messages
- Someone manually copies text from the PDF, edits it, regenerates a new PDF
- No audit trail of who reviewed what, when, or what changed

This is **15–20 minutes per patient** of manual work that scales linearly. With volume, it becomes a bottleneck. The data already lives in the database — the entire form, the scores, the AI report. There's no technical reason for this manual loop to exist.

## 2. Current State Analysis

### What Exists Today

| Asset | Location | Status | Details |
|-------|----------|--------|---------|
| `mental_health_evaluations` table | Supabase `public` | 20 rows, live | `form_data` (jsonb, ~86 fields), `scores` (jsonb), `report_markdown`, `report_pdf_url`, `status` |
| `assessment_access_codes` table | Supabase `public` | 1 row | Code-based auth for `/avaliacao` — reusable pattern |
| Assessment form | `frontend/app/[locale]/avaliacao/` | Live | Multi-step form, access-code protected |
| `AssessmentFormData` interface | `frontend/components/assessment/assessment.interface.ts` | Complete | 86+ typed fields: personal data, clinical profile, scales (PHQ-9, GAD-7, ISI, ASRS, etc.), meds, lifestyle, family |
| PDF generation | `frontend/app/api/assessment/generate-pdf/pdf-helpers.ts` | Working | `buildPdf(formData, reportMarkdown)` → branded A4 PDF buffer |
| AI report generation | `frontend/app/api/assessment/lib/generate-report-background.ts` | Working | Takes `formData` + `scores` + `uploads` → markdown report |
| Email delivery | `frontend/app/api/assessment/lib/send-email.ts` | Working | Sends PDF link to clinic email |
| `bb_doctors` table (currently `professionals`) | Supabase `public` | 0 rows, schema ready | `full_name`, `email`, `specialty`, `is_active` — rename to `bb_doctors` |
| `generated_documents` table | Supabase `public` | 0 rows, schema ready | Full approval lifecycle enum: `PENDING_GENERATION`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED` |
| Bernardo's HTML sketch | `claude_artifact/new_products/1_portal_comite_medico/` | Static prototype | Table view, sidebar filters, modal report view — hardcoded data, aspirational fields |

### What's Missing

- ❌ No internal-facing interface to view evaluations
- ❌ No way for doctors to edit form data or report content through a UI
- ❌ No approval workflow columns on `mental_health_evaluations`
- ❌ No way to regenerate reports/PDFs after edits
- ❌ No audit trail (who approved, when, what changed)
- ❌ No portal-specific access code

## 3. The Vision / Solution

### Design Principles

1. **Leverage what exists.** The form data, PDF generation, AI report generation, and code-auth pattern all exist. Reuse them — don't rebuild.
2. **Form data is the source of truth.** Doctors edit the actual form fields, not the markdown output. This keeps data integrity and enables clean regeneration.
3. **Two views, one feature.** A list view (work queue) and a detail view (patient assessment). Simple navigation, no deep hierarchy.
4. **Simple auth, simple UX.** Shared access code like `/avaliacao`. No login, no user management. The committee is 1–2 people today.
5. **Edit-then-approve flow.** Doctor opens evaluation → reviews data → edits fields if needed → approves → system regenerates report + PDF.
6. **Improve on the sketch.** Bernardo's HTML is the starting point for layout, but we adapt it to real data fields and improve the UX (detail page instead of modal, proper form editing).

### Key Capabilities

1. Code-protected portal at `/portal` (or `/comite`)
2. List view of all `mental_health_evaluations` with search, sort, and filter
3. Detail view at `/portal/[id]` showing full patient assessment data
4. Edit mode on the detail view — doctor can modify any form field
5. Approval action — marks evaluation as approved, triggers report + PDF regeneration
6. Rejection with notes — doctor can reject and leave feedback
7. Status tracking visible in the list view (pending, approved, rejected)

## 4. The System (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                        /portal (code-protected)                 │
│                                                                 │
│  ┌──────────────┐         ┌──────────────────────────────────┐  │
│  │  List View    │ click  │  Detail View /portal/[id]        │  │
│  │              │────────▶│                                  │  │
│  │  - Search     │         │  Read Mode: view all form data  │  │
│  │  - Filter     │         │  Edit Mode: modify form fields  │  │
│  │  - Sort       │         │  Actions: Approve / Reject      │  │
│  │  - Status     │         │  View: AI report + PDF link     │  │
│  │  badges       │         │                                  │  │
│  └──────────────┘         └──────────┬───────────────────────┘  │
│                                      │                          │
│                              Approve │                          │
│                                      ▼                          │
│                    ┌────────────────────────────┐               │
│                    │  API: /api/portal/approve   │               │
│                    │  1. Update form_data         │               │
│                    │  2. Re-run AI report gen     │               │
│                    │  3. Rebuild PDF              │               │
│                    │  4. Upload to storage        │               │
│                    │  5. Update DB row            │               │
│                    └────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │  Supabase           │
                    │  mental_health_     │
                    │  evaluations        │
                    │  + assessment_      │
                    │    access_codes     │
                    └────────────────────┘
```

## 5. User Flows

### Flow 1: Access the Portal

```
Doctor opens /portal → sees code input → enters portal access code
→ validated against assessment_access_codes (type = 'portal')
→ session cookie set → redirected to list view
```

### Flow 2: Review & Approve

```
List view → clicks patient row → /portal/[id] (detail view, read mode)
→ reviews data → clicks "Editar" → form fields become editable
→ modifies fields → clicks "Aprovar" → confirmation dialog
→ API saves updated form_data → regenerates AI report → rebuilds PDF
→ uploads new PDF → updates row (status=approved, approved_at, report_markdown, pdf_url)
→ redirected to list with success toast
```

### Flow 3: Reject

```
Detail view → clicks "Rejeitar" → enters rejection notes
→ API updates row (status=rejected, reviewer_notes)
→ back to list
```

## 6. Architecture & Code Location

### Directory Structure

```
frontend/
├── app/
│   ├── [locale]/
│   │   └── portal/
│   │       ├── layout.tsx              # Portal layout (header, nav)
│   │       ├── page.tsx                # Code entry / list view
│   │       └── [id]/
│   │           └── page.tsx            # Detail + edit view
│   │
│   └── api/
│       └── portal/
│           ├── validate-code/
│           │   └── route.ts            # Validate portal access code
│           ├── evaluations/
│           │   └── route.ts            # GET: list evaluations
│           ├── evaluations/[id]/
│           │   └── route.ts            # GET: single evaluation, PATCH: update form_data
│           └── evaluations/[id]/approve/
│               └── route.ts            # POST: approve + regenerate report + PDF
│
├── components/
│   └── portal/
│       ├── PortalCodeGate.tsx          # Access code input component
│       ├── EvaluationListView.tsx      # Main table/list with filters
│       ├── EvaluationDetailView.tsx    # Read-mode detail display
│       ├── EvaluationEditForm.tsx      # Edit-mode form (reuses AssessmentFormData shape)
│       ├── ApprovalActions.tsx         # Approve/Reject buttons + dialogs
│       └── portal.interface.ts         # Portal-specific types
```

### Naming Convention

All portal components prefixed with `Portal` or `Evaluation`. API routes under `/api/portal/`.

## 7. Database Schema

### Migration: Add approval columns to `mental_health_evaluations`

```sql
-- Add approval workflow columns to mental_health_evaluations
ALTER TABLE public.mental_health_evaluations
  ADD COLUMN IF NOT EXISTS reviewer_status text DEFAULT 'pending_review'
    CHECK (reviewer_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewer_notes text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS form_data_history jsonb DEFAULT '[]'::jsonb;

-- Update existing rows to 'pending_review'
UPDATE public.mental_health_evaluations
  SET reviewer_status = 'pending_review'
  WHERE reviewer_status IS NULL;

COMMENT ON COLUMN public.mental_health_evaluations.reviewer_status IS 'Approval status: pending_review, approved, rejected';
COMMENT ON COLUMN public.mental_health_evaluations.reviewer_notes IS 'Feedback from the reviewing doctor on rejection or notes on approval';
COMMENT ON COLUMN public.mental_health_evaluations.approved_at IS 'Timestamp of approval';
COMMENT ON COLUMN public.mental_health_evaluations.approved_by IS 'Name of the doctor who approved (simple text, no FK for now)';
COMMENT ON COLUMN public.mental_health_evaluations.form_data_history IS 'Array of {timestamp, changed_fields, changed_by} for audit trail';
```

### Migration: Add portal access code

```sql
-- Add a portal access code to the existing table
INSERT INTO public.assessment_access_codes (code, label, active)
VALUES ('PORTAL2026', 'Portal Comitê Médico', true);
```

**No new tables needed.** We add 5 columns to the existing table and one row to the access codes table.

## 8. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/portal/validate-code` | Validate portal access code, set session cookie |
| GET | `/api/portal/evaluations` | List all evaluations (supports `?status=`, `?search=`, `?sort=`) |
| GET | `/api/portal/evaluations/[id]` | Get single evaluation with full form_data |
| PATCH | `/api/portal/evaluations/[id]` | Update form_data fields (partial update) |
| POST | `/api/portal/evaluations/[id]/approve` | Approve: save edits → regenerate report → rebuild PDF → update row |
| POST | `/api/portal/evaluations/[id]/reject` | Reject: save reviewer_notes, set status to rejected |

## 9. Integration Points

### Existing code to reuse

| What | File | How |
|------|------|-----|
| PDF generation | `frontend/app/api/assessment/generate-pdf/pdf-helpers.ts` | Import `buildPdf()` directly — same branded PDF |
| AI report generation | `frontend/app/api/assessment/lib/generate-report-background.ts` | Import `generateReportBackground()` — same AI pipeline |
| Access code validation | `frontend/app/api/assessment/validate-code/route.ts` | Same pattern — query `assessment_access_codes`, check code |
| Form data types | `frontend/components/assessment/assessment.interface.ts` | Reuse `AssessmentFormData` for type safety in edit forms |
| Supabase client | `frontend/app/api/assessment/submit/route.ts` | Same `createClient()` pattern with service role key |

### What we DON'T touch

- The existing `/avaliacao` flow — completely untouched
- The WhatsApp agent tables (`patients`, `anamnesis_responses`, `protocols`, `conversation_state`)
- Email delivery — no automated emails from the portal (doctor does this manually for now)

## 10. Key UX Decisions

### List View

- **Table layout** inspired by Bernardo's sketch but adapted to real data columns: Patient Name, Profile (`adulto`/`executivo`/`neuro`/etc.), Date Submitted, Status (pending/approved/rejected), PDF link
- **Search** by patient name
- **Filter** by status (pending_review, approved, rejected) and by profile
- **Sort** by date (newest first default), by name, by status
- Clicking a row navigates to `/portal/[id]`

### Detail View (`/portal/[id]`)

- **Read mode** (default): Displays all form data organized by section (same sections as the assessment form — personal data, clinical profile, symptoms, scales, medications, lifestyle, family)
- Shows computed scores with visual indicators
- Shows AI-generated report markdown (rendered)
- Shows current PDF link
- **Edit mode** (toggle): Form fields become editable. Same field types as the assessment form.
- **Action bar**: "Editar" / "Aprovar" / "Rejeitar" / "Voltar"

### Approval Flow

- On "Aprovar": if form_data was edited, save edits first. Then trigger regeneration pipeline (AI report → PDF → upload → update row). Show loading state during regeneration (~30-60 seconds).
- On "Rejeitar": modal with textarea for notes. Saves notes and status.

## 11. Implementation Phases

### Phase 1: Database + Auth + List View
- [ ] Run migration (add columns to `mental_health_evaluations`, add portal access code)
- [ ] Create `/api/portal/validate-code` endpoint
- [ ] Create `/api/portal/evaluations` endpoint (GET list)
- [ ] Create `PortalCodeGate` component
- [ ] Create `EvaluationListView` component
- [ ] Create `/portal` page with code gate + list view
- [ ] Wire up search, filter, sort

### Phase 2: Detail View + Edit
- [ ] Create `/api/portal/evaluations/[id]` endpoint (GET single, PATCH update)
- [ ] Create `EvaluationDetailView` component (read mode)
- [ ] Create `EvaluationEditForm` component (edit mode)
- [ ] Create `/portal/[id]` page
- [ ] Organize form data display by sections

### Phase 3: Approval + PDF Regeneration
- [ ] Create `/api/portal/evaluations/[id]/approve` endpoint
- [ ] Create `/api/portal/evaluations/[id]/reject` endpoint
- [ ] Create `ApprovalActions` component
- [ ] Wire up approval flow (save → regenerate report → rebuild PDF → update)
- [ ] Add audit trail entries to `form_data_history`
- [ ] Loading states and success/error feedback

## 12. Open Questions

1. **Portal route**: `/portal` — confirmed.
2. **Session duration**: How long should the portal code session last before requiring re-entry? Suggesting 24 hours.
3. **Email on approval**: Should the system auto-email the new PDF to the clinic when approved, or is that manual? Starting with manual.
4. **Concurrent editing**: Not a concern with 1-2 users, but noted for future.
5. **Report markdown editing**: The strategy focuses on form_data editing + AI regeneration. If doctors want to also manually tweak the final report text (not form fields), that's a future enhancement.
