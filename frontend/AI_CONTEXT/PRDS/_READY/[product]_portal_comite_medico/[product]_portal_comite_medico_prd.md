# Portal Comitê Médico — PRD

**Version:** 1.0
**Date:** 2026-03-12
**Status:** Implementation Ready

---

## 1. Overview

The Portal Comitê Médico is an internal, code-protected interface at `/portal` for the Bright Brains medical committee to review, edit, approve, and regenerate patient assessment reports. It consumes data from the existing `mental_health_evaluations` table (populated by the `/avaliacao` form) and reuses the existing AI report generation and PDF generation pipelines. This eliminates the current manual workflow of WhatsApp-based PDF review and editing. See the strategy doc for full problem context.

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND — Next.js 15 App Router                    │
│                                                                        │
│  /portal ──────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  ┌─────────────┐    ┌─────────────────────────────────────────┐│   │
│  │  │ CodeGate    │    │ List View (EvaluationListView)          ││   │
│  │  │ Component   │───▶│ - Table of evaluations                  ││   │
│  │  │ (auth wall) │    │ - Search, filter (status, profile)     ││   │
│  │  └─────────────┘    │ - Sort (date, name)                    ││   │
│  │                      │ - Status badges                        ││   │
│  │                      └──────────────┬────────────────────────┘│   │
│  │                                     │ click row               │   │
│  │                                     ▼                         │   │
│  │  /portal/[id] ─────────────────────────────────────────────┐  │   │
│  │  │                                                          │  │   │
│  │  │  READ MODE ───▶ EDIT MODE ───▶ APPROVE / REJECT          │  │   │
│  │  │                                                          │  │   │
│  │  │  EvaluationDetailView    EvaluationEditForm              │  │   │
│  │  │  (sections of form data) (editable form fields)          │  │   │
│  │  │  + AI report rendered    + ApprovalActions                │  │   │
│  │  │  + PDF link              + RejectDialog                  │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  API Routes (/api/portal/) ────────────────────────────────────────┐  │
│  │  POST validate-code         → Supabase: assessment_access_codes │  │
│  │  GET  evaluations           → Supabase: mental_health_evaluations│  │
│  │  GET  evaluations/[id]      → single row with full form_data    │  │
│  │  PATCH evaluations/[id]     → update form_data + scores         │  │
│  │  POST evaluations/[id]/approve → save + regenerate report + PDF │  │
│  │  POST evaluations/[id]/reject  → save rejection notes + status  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                        │                               │
│                                        ▼                               │
│                              ┌──────────────────┐                      │
│                              │  Supabase         │                      │
│                              │  + Storage bucket │                      │
│                              └──────────────────┘                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Principles & Architecture Decisions

1. **Reuse over rebuild.** PDF generation (`buildPdf`), AI report generation (`generateReportBackground`), and score computation (`computeScores`) already exist. The portal imports and calls them — no duplication.

2. **Form data is the source of truth.** Doctors edit the actual `form_data` fields, not the markdown output. On approval, the system re-runs scores → AI report → PDF. This guarantees consistency between data and output.

3. **Code-protected, not auth-protected.** A shared access code (stored in `assessment_access_codes`) protects the portal. The code is validated via API, and a cookie tracks the session. No user accounts, no Supabase Auth. This matches the existing `/avaliacao` pattern and keeps scope minimal.

4. **Feature module pattern.** All portal code lives in `features/portal/` (components, hooks, services, types) following the project's established feature-based structure. Pages and API routes live under `app/`.

5. **TanStack Query for server state.** Unlike the legacy assessment feature (which uses `useState` + `fetch`), the portal follows the newer convention: TanStack Query for all server data, `nuqs` for URL-based filter/sort state.

6. **Dark theme from the HTML sketch.** The portal uses the design tokens from Bernardo's prototype: dark navy background (`#060e1a`), teal accent (`#00c9b1`), Syne headings, DM Sans body, JetBrains Mono for data. Implemented via Tailwind CSS custom theme values.

---

## 4. Directory Structure

```
frontend/
├── app/
│   ├── [locale]/
│   │   └── portal/
│   │       ├── layout.tsx                          # Dark theme layout, noindex, portal header
│   │       ├── page.tsx                            # Renders PortalPage (code gate + list)
│   │       └── [id]/
│   │           └── page.tsx                        # Renders EvaluationDetailPage
│   │
│   └── api/
│       └── portal/
│           ├── validate-code/
│           │   └── route.ts                        # POST: validate portal access code
│           ├── evaluations/
│           │   └── route.ts                        # GET: list evaluations with filters
│           └── evaluations/
│               └── [id]/
│                   ├── route.ts                    # GET: single evaluation, PATCH: update
│                   ├── approve/
│                   │   └── route.ts                # POST: approve + regenerate
│                   └── reject/
│                       └── route.ts                # POST: reject with notes
│
├── features/
│   └── portal/
│       ├── portal.interface.ts                     # Types: EvaluationListItem, EvaluationDetail, etc.
│       ├── components/
│       │   ├── PortalPageComponent.tsx              # Code gate + list orchestrator
│       │   ├── PortalCodeGateComponent.tsx          # Access code input screen
│       │   ├── PortalHeaderComponent.tsx            # Sticky header (logo, stats badge)
│       │   ├── EvaluationListViewComponent.tsx      # Table with filters, search, sort
│       │   ├── EvaluationDetailPageComponent.tsx    # Detail page orchestrator (read/edit toggle)
│       │   ├── EvaluationDetailViewComponent.tsx    # Read-only sections of form data
│       │   ├── EvaluationEditFormComponent.tsx      # Editable form (React Hook Form)
│       │   ├── ApprovalActionsComponent.tsx         # Approve/Reject buttons + confirm dialogs
│       │   ├── ReportPreviewComponent.tsx           # Rendered markdown report view
│       │   ├── StatusBadgeComponent.tsx             # Colored status badge (pending/approved/rejected)
│       │   └── ProfileBadgeComponent.tsx            # Patient profile tag with color
│       ├── hooks/
│       │   ├── useEvaluationsQueryHook.ts           # TanStack Query: list evaluations
│       │   ├── useEvaluationByIdQueryHook.ts        # TanStack Query: single evaluation
│       │   ├── useUpdateEvaluationMutationHook.ts   # TanStack Mutation: PATCH form_data
│       │   ├── useApproveEvaluationMutationHook.ts  # TanStack Mutation: POST approve
│       │   └── useRejectEvaluationMutationHook.ts   # TanStack Mutation: POST reject
│       ├── constants/
│       │   ├── portal-theme.ts                      # Design tokens from HTML sketch
│       │   ├── profile-options.ts                   # Profile labels + colors
│       │   └── form-sections.ts                     # Section definitions for detail/edit view
│       └── helpers/
│           └── format-evaluation.ts                 # Date formatting, status labels, etc.
```

---

## 5. Component Specifications

### PortalCodeGateComponent

- **File:** `features/portal/components/PortalCodeGateComponent.tsx`
- **Purpose:** Access code input screen — renders when no valid portal session cookie exists
- **Props:** `onSuccess: () => void`
- **Behavior:** Text input + submit button. Calls `POST /api/portal/validate-code`. On success, sets a cookie `portal_session` (24h expiry) and calls `onSuccess`. On failure, shows error message.
- **Visual:** Centered card on dark background, matching avaliacao code entry style

### PortalPageComponent

- **File:** `features/portal/components/PortalPageComponent.tsx`
- **Purpose:** Orchestrates code gate vs list view based on session cookie
- **State:** `isAuthenticated` boolean, checked by reading `portal_session` cookie on mount
- **Renders:** `PortalCodeGateComponent` if not authenticated, `EvaluationListViewComponent` if authenticated

### EvaluationListViewComponent

- **File:** `features/portal/components/EvaluationListViewComponent.tsx`
- **Purpose:** Main work queue table showing all evaluations
- **Data:** `useEvaluationsQueryHook()` with query params from URL state (`nuqs`)
- **URL State (nuqs):** `status` (filter), `profile` (filter), `search` (text), `sort` (date_desc default)
- **Columns:** Patient Name, Profile (colored badge), Date Submitted, Status (badge), PDF link, "Ver" button
- **Layout:** Full-width table with sticky header, sidebar with filter buttons (profile list, status list), top toolbar with search + sort buttons
- **Visual reference:** Bernardo's HTML sketch table layout — dark surface cards, teal accent, urgency-style status badges adapted to review status

### EvaluationDetailPageComponent

- **File:** `features/portal/components/EvaluationDetailPageComponent.tsx`
- **Purpose:** Orchestrates the detail page — read mode, edit mode, and approval actions
- **Data:** `useEvaluationByIdQueryHook(id)`
- **State:** `mode: 'read' | 'edit'` via `useState`
- **Renders:** Header (patient name, profile, date) + `EvaluationDetailViewComponent` (read) or `EvaluationEditFormComponent` (edit) + `ApprovalActionsComponent` + `ReportPreviewComponent`

### EvaluationDetailViewComponent

- **File:** `features/portal/components/EvaluationDetailViewComponent.tsx`
- **Purpose:** Read-only display of all form_data organized by sections
- **Props:** `evaluation: EvaluationDetail`
- **Sections:** Personal Data, Clinical Profile, Symptoms, Clinical Scales (with score bars), Medications & Supplements, Lifestyle, Family History, Triage
- **Visual:** Section cards with teal accent borders (from HTML sketch `.report-section-title` style), field label/value pairs in grid layout (from `.report-field` style), score bars with colored fills (from `.score-bar-wrap` style)

### EvaluationEditFormComponent

- **File:** `features/portal/components/EvaluationEditFormComponent.tsx`
- **Purpose:** Editable form for all form_data fields, organized by same sections as detail view
- **Props:** `evaluation: EvaluationDetail`, `onSave: (data: Partial<AssessmentFormData>) => void`, `onCancel: () => void`
- **Form:** React Hook Form with `AssessmentFormData` shape. Pre-populated with existing `form_data`. Only changed fields are submitted.
- **Reuses:** Field components from `features/assessment/components/fields/` (Input, Select, Textarea, CheckboxGroup, RadioGroup) — imported directly

### ApprovalActionsComponent

- **File:** `features/portal/components/ApprovalActionsComponent.tsx`
- **Purpose:** Approve and Reject action buttons with confirmation dialogs
- **Props:** `evaluationId: string`, `hasEdits: boolean`, `onApproved: () => void`
- **Approve flow:** Confirmation dialog → calls `useApproveEvaluationMutationHook` → shows loading spinner ("Gerando relatório...") → on success, invalidates queries, shows toast, navigates back to list
- **Reject flow:** Dialog with textarea for notes → calls `useRejectEvaluationMutationHook` → navigates back to list

### ReportPreviewComponent

- **File:** `features/portal/components/ReportPreviewComponent.tsx`
- **Purpose:** Renders the AI-generated `report_markdown` as formatted HTML
- **Props:** `markdown: string | null`, `pdfUrl: string | null`
- **Visual:** Markdown rendered in the `.report-text` style from HTML sketch (dark surface card with teal left border). PDF download link button.

---

## 6. Hook Specifications

### useEvaluationsQueryHook

- **File:** `features/portal/hooks/useEvaluationsQueryHook.ts`
- **Query key:** `['portal', 'evaluations', { status, profile, search, sort }]`
- **Fetches:** `GET /api/portal/evaluations?status=&profile=&search=&sort=`
- **Returns:** `{ evaluations: EvaluationListItem[], isLoading, error }`

### useEvaluationByIdQueryHook

- **File:** `features/portal/hooks/useEvaluationByIdQueryHook.ts`
- **Query key:** `['portal', 'evaluations', id]`
- **Fetches:** `GET /api/portal/evaluations/${id}`
- **Returns:** `{ evaluation: EvaluationDetail | undefined, isLoading, error }`

### useUpdateEvaluationMutationHook

- **File:** `features/portal/hooks/useUpdateEvaluationMutationHook.ts`
- **Mutation:** `PATCH /api/portal/evaluations/${id}` with `{ form_data, scores }`
- **On success:** Invalidates `['portal', 'evaluations', id]`

### useApproveEvaluationMutationHook

- **File:** `features/portal/hooks/useApproveEvaluationMutationHook.ts`
- **Mutation:** `POST /api/portal/evaluations/${id}/approve` with `{ approved_by }`
- **On success:** Invalidates `['portal', 'evaluations']` (list) and `['portal', 'evaluations', id]`
- **Note:** This is a long-running request (~30-60s) — the API regenerates the AI report and PDF before responding

### useRejectEvaluationMutationHook

- **File:** `features/portal/hooks/useRejectEvaluationMutationHook.ts`
- **Mutation:** `POST /api/portal/evaluations/${id}/reject` with `{ reviewer_notes }`
- **On success:** Invalidates both list and detail queries

---

## 7. API Endpoints

### POST `/api/portal/validate-code`

```
Request:  { code: string }
Response: { valid: boolean }
Side effect: Sets `portal_session` cookie (httpOnly, 24h, sameSite=strict) if valid
```

Implementation: Query `assessment_access_codes` where `code = input AND active = true AND label LIKE '%Portal%'`. Same pattern as existing `validate-code/route.ts` but checks a different code.

### GET `/api/portal/evaluations`

```
Query params: ?status=pending_review|approved|rejected  &profile=adulto|neuro|...  &search=name  &sort=date_desc|date_asc|name_asc
Response: EvaluationListItem[]
```

Each `EvaluationListItem`:
```typescript
{
  id: string
  patient_name: string
  patient_profile: string | null
  patient_email: string | null
  created_at: string
  status: string              // existing status column
  reviewer_status: string     // pending_review | approved | rejected
  report_pdf_url: string | null
  scores: Record<string, number> | null
}
```

Selects only list-relevant columns (NOT full form_data) for performance.

### GET `/api/portal/evaluations/[id]`

```
Response: EvaluationDetail (full row including form_data, scores, report_markdown, etc.)
```

### PATCH `/api/portal/evaluations/[id]`

```
Request:  { form_data: Partial<AssessmentFormData>, scores?: Record<string, number> }
Response: { success: true }
```

Merges partial form_data into existing jsonb. Appends to `form_data_history` array: `{ timestamp, changed_by, changed_fields: string[] }`.

### POST `/api/portal/evaluations/[id]/approve`

```
Request:  { approved_by: string }
Response: { success: true, report_pdf_url: string }
```

Pipeline:
1. Read current `form_data` and `scores` from DB
2. Call `generateReportBackground(formData, scores)` → new `report_markdown`
3. Call `buildPdf(formData, reportMarkdown)` → PDF buffer
4. Upload PDF to Supabase Storage (`assessment-pdfs` bucket)
5. Update row: `report_markdown`, `report_pdf_url`, `reviewer_status = 'approved'`, `approved_at = now()`, `approved_by`

**Runtime:** `nodejs`, `maxDuration: 300` (same as submit route — AI generation takes ~30-60s)

### POST `/api/portal/evaluations/[id]/reject`

```
Request:  { reviewer_notes: string }
Response: { success: true }
```

Updates row: `reviewer_status = 'rejected'`, `reviewer_notes`.

---

## 8. Database Schema

### Migration 1: Add approval columns

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

COMMENT ON COLUMN public.mental_health_evaluations.reviewer_status IS 'pending_review | approved | rejected';
COMMENT ON COLUMN public.mental_health_evaluations.reviewer_notes IS 'Doctor feedback on rejection or approval notes';
COMMENT ON COLUMN public.mental_health_evaluations.approved_at IS 'Timestamp when approved';
COMMENT ON COLUMN public.mental_health_evaluations.approved_by IS 'Name of approving doctor (simple text)';
COMMENT ON COLUMN public.mental_health_evaluations.form_data_history IS 'Audit trail: [{timestamp, changed_by, changed_fields}]';
```

### Migration 2: Rename professionals → bb_doctors

```sql
ALTER TABLE public.professionals RENAME TO bb_doctors;
```

### Migration 3: Add portal access code

```sql
INSERT INTO public.assessment_access_codes (code, label, active)
VALUES ('PORTAL2026', 'Portal Comitê Médico', true);
```

---

## 9. Design System — Visual Reference

The portal uses a dark clinical theme derived from Bernardo's HTML sketch. These values map to Tailwind classes.

### Color Tokens

| Token | Hex | Tailwind Usage |
|-------|-----|----------------|
| `--bg` | `#060e1a` | Page background |
| `--surface` | `#0c1a2e` | Cards, header, sidebar |
| `--surface2` | `#0f2240` | Nested surfaces, table header |
| `--border` | `#1a3a5c` | Default borders |
| `--border2` | `#234872` | Hover/active borders |
| `--accent` | `#00c9b1` | Primary accent (teal) — buttons, active states, badges |
| `--accent2` | `#0090ff` | Secondary accent (blue) |
| `--text` | `#cce6f7` | Primary text |
| `--text-dim` | `#5a7fa0` | Secondary text |
| `--text-muted` | `#3a5a75` | Disabled/label text |
| `--danger` | `#ff4d6d` | Reject, error |
| `--warn` | `#f5a623` | Warning |
| `--ok` | `#00d896` | Success, approved |

### Typography

| Use | Font | Weight |
|-----|------|--------|
| Headings, logo | Syne | 700, 800 |
| Body text | DM Sans | 300–600 |
| Data/mono values | JetBrains Mono | 400, 500 |

### Profile Badge Colors

| Profile | Background | Text |
|---------|------------|------|
| `adulto` | `rgba(96,165,250,0.12)` | `#93c5fd` |
| `infantil` | `rgba(52,211,153,0.13)` | `#6ee7b7` |
| `neuro` | `rgba(167,139,250,0.15)` | `#c4b5fd` |
| `executivo` | `rgba(251,191,36,0.12)` | `#fcd34d` |
| `longevidade` | `rgba(251,146,60,0.12)` | `#fdba74` |

### Status Badge Colors

| Status | Background | Text | Border |
|--------|------------|------|--------|
| `pending_review` | `rgba(245,166,35,0.12)` | `#f5b842` | `rgba(245,166,35,0.3)` |
| `approved` | `rgba(0,216,150,0.12)` | `#00d896` | `rgba(0,216,150,0.3)` |
| `rejected` | `rgba(255,77,109,0.15)` | `#ff6b85` | `rgba(255,77,109,0.3)` |

### Key Visual Patterns from the Sketch

- **Table rows:** Dark surface background, subtle border-bottom, teal hover highlight (`rgba(0,201,177,0.05)`)
- **Sidebar filters:** Button list with active state = teal background tint + teal text
- **Section titles in detail view:** Syne font, uppercase, teal color, bottom border with `rgba(0,201,177,0.2)`
- **Data fields in detail view:** Dark `surface2` rounded cards with label (muted, uppercase, 10px) + value (14px, white)
- **Score bars:** 6px track on dark, colored fill per metric
- **Report text blocks:** `surface2` background, teal left border (3px), generous line-height (1.75)

---

## 10. Configuration & Constants

### portal-theme.ts

```typescript
export const PORTAL_COLORS = {
  bg: '#060e1a',
  surface: '#0c1a2e',
  surface2: '#0f2240',
  border: '#1a3a5c',
  border2: '#234872',
  accent: '#00c9b1',
  accent2: '#0090ff',
  text: '#cce6f7',
  textDim: '#5a7fa0',
  textMuted: '#3a5a75',
  danger: '#ff4d6d',
  warn: '#f5a623',
  ok: '#00d896',
} as const
```

### profile-options.ts

```typescript
export const PROFILE_OPTIONS = [
  { value: 'adulto', label: 'Adulto', color: '#93c5fd', bg: 'rgba(96,165,250,0.12)' },
  { value: 'infantil', label: 'Infantil', color: '#6ee7b7', bg: 'rgba(52,211,153,0.13)' },
  { value: 'neuro', label: 'Neuro', color: '#c4b5fd', bg: 'rgba(167,139,250,0.15)' },
  { value: 'executivo', label: 'Executivo', color: '#fcd34d', bg: 'rgba(251,191,36,0.12)' },
  { value: 'longevidade', label: 'Longevidade', color: '#fdba74', bg: 'rgba(251,146,60,0.12)' },
] as const

export const STATUS_OPTIONS = [
  { value: 'pending_review', label: 'Pendente', color: '#f5b842', bg: 'rgba(245,166,35,0.12)' },
  { value: 'approved', label: 'Aprovado', color: '#00d896', bg: 'rgba(0,216,150,0.12)' },
  { value: 'rejected', label: 'Rejeitado', color: '#ff6b85', bg: 'rgba(255,77,109,0.15)' },
] as const
```

### form-sections.ts

Defines the sections and their field keys for the detail/edit views. Maps `AssessmentFormData` fields into display groups:

```typescript
export const FORM_SECTIONS = [
  { id: 'personal', label: 'Dados Pessoais', fields: ['nome','nascimento','cpf','telefone','email','sexo','profissao','escolaridade','peso','altura'] },
  { id: 'clinical', label: 'Perfil Clínico', fields: ['publico','queixaPrincipal','tempoSintomas','eventoDesencadeador'] },
  { id: 'history', label: 'Histórico', fields: ['diagAnterior','diagAnterioresDetalhe','psicoterapia','internacao','condicoesCronicas','examesNeuro','examesNeuroDetalhe'] },
  { id: 'triage', label: 'Triagem', fields: ['triagemProfissional','triagemData','triagemFormato','transcricaoTriagem','triagemResumo','triagemObservacoes'] },
  { id: 'symptoms', label: 'Sintomas', fields: ['sintomasAtuais','outrosSintomas'] },
  { id: 'scales', label: 'Escalas Clínicas', fields: ['phq9','gad7','isi','asrs','aq10','ocir','mbi','pcl5','mdq','pss10','ad8','nms','alsfrs','snapiv','spin','auditc'] },
  { id: 'medications', label: 'Medicamentos & Suplementos', fields: ['usaMedicamento','medicamentos','medPassado','medPassadoDetalhe','efeitosAdversos','alergias','suplementos','supObs'] },
  { id: 'lifestyle', label: 'Estilo de Vida', fields: ['estadoCivil','satisfacaoRelacionamento','situacaoProfissional','cargaHoraria','horaDormir','horaAcordar','qualidadeSono','atividadeFisica','cafeina','tabaco','cannabis','neuromod','neuromodDetalhes','estresse','redeApoio','fontesEstresse','estiloVidaObs'] },
  { id: 'family', label: 'Histórico Familiar', fields: ['familiaCondicoes','familiaDetalhes','infoAdicional'] },
  { id: 'wearables', label: 'Wearables', fields: ['usaWearable','wDispositivo','wFCRepouso','wHRV','wSonoDuracao','wPassos','wEstresse','wearableObs'] },
] as const
```

---

## 11. Implementation Order

1. Run database migrations (columns + access code + rename table)
2. Create portal API routes: validate-code, evaluations list, evaluations detail
3. Create portal feature module structure (`features/portal/`)
4. Build PortalCodeGateComponent + PortalPageComponent
5. Build EvaluationListViewComponent with TanStack Query + nuqs
6. Build portal layout + page routes
7. Build EvaluationDetailViewComponent (read mode)
8. Build EvaluationEditFormComponent (edit mode with React Hook Form)
9. Create PATCH and approve/reject API routes
10. Build ApprovalActionsComponent + ReportPreviewComponent
11. Wire approval flow: save → regenerate → PDF → update
12. Polish: loading states, error handling, toasts, responsive

---

## 12. Dependencies

### External packages (already in project)

| Package | Use |
|---------|-----|
| `@tanstack/react-query` | Server state for evaluations |
| `nuqs` | URL state for filters/sort |
| `react-hook-form` | Edit form |
| `@anthropic-ai/sdk` | AI report regeneration (existing) |
| `jspdf` | PDF generation (existing) |
| `@supabase/supabase-js` | Database (existing) |

### Possibly new

| Package | Use |
|---------|-----|
| `react-markdown` or `marked` | Render report_markdown in detail view |

### Existing code reused

| File | Import |
|------|--------|
| `app/api/assessment/generate-pdf/pdf-helpers.ts` | `buildPdf()` |
| `app/api/assessment/lib/generate-report-background.ts` | `generateReportBackground()` |
| `features/assessment/helpers/compute-scores.ts` | `computeScores()` |
| `features/assessment/components/assessment.interface.ts` | `AssessmentFormData` type |
| `features/assessment/components/fields/*` | Input, Select, Textarea, etc. |
| `features/assessment/components/constants/scoring-ranges.ts` | Score display ranges |

### Environment variables (existing, no new ones needed)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

---

## 13. Future Enhancements

- **Individual doctor logins** — when committee grows beyond 2-3 people
- **Direct markdown editing** — allow tweaking the final report text without re-running AI
- **Email on approval** — auto-send the new PDF to the clinic email
- **Dashboard** — statistics view (evaluations by profile, by month, approval rates) — separate PRD
- **Bright Stim + Bright Detection integration** — future products that will also feed into the portal
