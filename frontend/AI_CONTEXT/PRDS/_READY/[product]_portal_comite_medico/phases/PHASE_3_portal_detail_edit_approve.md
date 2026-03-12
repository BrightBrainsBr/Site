# Portal Comitê Médico — Phase 3: Detail View, Edit Form & Approval Flow

**Cursor Agent:** /frontend-engineer
**Wave:** 2
**Objective:** Build the evaluation detail page with read/edit modes, the approval/rejection flow, and report preview. Wire up the complete end-to-end cycle: view → edit → approve → regenerate.
**Depends on:** Phase 1 (API routes), Phase 2 (portal pages, navigation)

**Files owned by this phase:**
- `frontend/app/[locale]/portal/[id]/page.tsx`
- `frontend/features/portal/components/EvaluationDetailPageComponent.tsx`
- `frontend/features/portal/components/EvaluationDetailViewComponent.tsx`
- `frontend/features/portal/components/EvaluationEditFormComponent.tsx`
- `frontend/features/portal/components/ApprovalActionsComponent.tsx`
- `frontend/features/portal/components/ReportPreviewComponent.tsx`
- `frontend/features/portal/hooks/useEvaluationByIdQueryHook.ts`
- `frontend/features/portal/hooks/useUpdateEvaluationMutationHook.ts`
- `frontend/features/portal/hooks/useApproveEvaluationMutationHook.ts`
- `frontend/features/portal/hooks/useRejectEvaluationMutationHook.ts`

---

## 1. Files to Create

```
frontend/
├── app/[locale]/portal/
│   └── [id]/
│       └── page.tsx
│
├── features/portal/
│   ├── components/
│   │   ├── EvaluationDetailPageComponent.tsx
│   │   ├── EvaluationDetailViewComponent.tsx
│   │   ├── EvaluationEditFormComponent.tsx
│   │   ├── ApprovalActionsComponent.tsx
│   │   └── ReportPreviewComponent.tsx
│   └── hooks/
│       ├── useEvaluationByIdQueryHook.ts
│       ├── useUpdateEvaluationMutationHook.ts
│       ├── useApproveEvaluationMutationHook.ts
│       └── useRejectEvaluationMutationHook.ts
```

---

## 2. What to Build

### page.tsx (`/portal/[id]`)

Thin wrapper. Extracts `id` from params, renders `EvaluationDetailPageComponent`.

### EvaluationDetailPageComponent

Orchestrator for the detail page.

- **Data:** `useEvaluationByIdQueryHook(id)`
- **State:** `mode: 'read' | 'edit'` — default `'read'`
- **Layout:**
  1. **Back button** — top left, navigates to `/portal`
  2. **Patient header** — name (Syne, bold, 22px), subtitle line: profile badge + birth date + date submitted + CID if available + reviewer_status badge
  3. **Action bar** — right-aligned: "Editar" (outline btn), "Aprovar" (accent btn), "Rejeitar" (danger outline btn). Visibility depends on `reviewer_status`:
     - If `pending_review`: show all three
     - If `approved`: show "Aprovado" badge + "Editar" (to re-edit and re-approve)
     - If `rejected`: show "Rejeitado" badge + rejection notes + "Editar"
  4. **Content area:**
     - `mode === 'read'`: `EvaluationDetailViewComponent` + `ReportPreviewComponent`
     - `mode === 'edit'`: `EvaluationEditFormComponent`
  5. **Approval modals:** handled by `ApprovalActionsComponent`

### EvaluationDetailViewComponent

Read-only display of all form_data, organized by sections defined in `form-sections.ts`.

- **Props:** `evaluation: EvaluationDetail`
- **Layout:** Vertical stack of section cards. Each section:
  - **Section title:** Syne font, 13px, uppercase, tracking-[2px], teal color, bottom border `rgba(0,201,177,0.2)` — matches HTML sketch `.report-section-title`
  - **Field grid:** 2-column responsive grid (1 col on mobile). Each field:
    - Container: `surface2` bg, rounded-lg, p-3 — matches HTML sketch `.report-field`
    - Label: 10px, uppercase, tracking-[1.5px], muted color — matches `.report-field-label`
    - Value: 14px, text color, font-medium — matches `.report-field-value`
  - **Special rendering for specific field types:**
    - **Arrays** (e.g., `sintomasAtuais`, `condicoesCronicas`): comma-separated pills or bullet list
    - **Clinical scales** (phq9, gad7, etc.): Score bars with colored fills — matches HTML sketch `.score-bar-wrap`. Show scale name, computed score, max score, and colored progress bar. Use scoring ranges from `features/assessment/components/constants/scoring-ranges.ts` for colors.
    - **Medications array:** Table-like display (nome, dose, tempo)
    - **Supplements array:** Table-like display (nome, dose)
    - **Empty/null fields:** Show "—" in dim text, or hide the field entirely
    - **Boolean fields:** Show "Sim" / "Não"

**Sections to render (from form-sections.ts):**
1. Dados Pessoais
2. Perfil Clínico
3. Histórico
4. Triagem
5. Sintomas
6. Escalas Clínicas (with score bars)
7. Medicamentos & Suplementos
8. Estilo de Vida
9. Histórico Familiar
10. Wearables

### EvaluationEditFormComponent

Editable form for all form_data fields.

- **Props:** `evaluation: EvaluationDetail`, `onSave: () => void`, `onCancel: () => void`
- **Form library:** React Hook Form
- **Default values:** Pre-populated from `evaluation.form_data`
- **Layout:** Same section structure as the detail view. Section cards with form fields inside.
- **Field components:** Reuse from `features/assessment/components/fields/`:
  - `Input` — text, date, number fields
  - `Select` — dropdown fields (sexo, publico, etc.)
  - `Textarea` — long text fields (queixaPrincipal, transcricaoTriagem, etc.)
  - `CheckboxGroup` — multi-select arrays (sintomasAtuais, condicoesCronicas, etc.)
  - `RadioGroup` — yes/no fields
- **Scale editing:** Clinical scale arrays (phq9, gad7, etc.) — render as a numbered list of inputs with the question text. Each is a number input 0-3 or 0-4 depending on scale. When scales are edited, recompute scores using `computeScores()` from `features/assessment/helpers/compute-scores.ts`.
- **Submit behavior:**
  1. Compare current form values with original `evaluation.form_data`
  2. Extract only changed fields
  3. If scales changed, recompute scores
  4. Call `useUpdateEvaluationMutationHook` with `{ form_data: changedFields, scores: newScores }`
  5. On success: switch back to read mode, refetch evaluation data
- **Action bar at bottom:**
  - "Cancelar" (outline, calls onCancel)
  - "Salvar alterações" (accent, submits form)

### ApprovalActionsComponent

- **Props:** `evaluationId: string`, `reviewerStatus: ReviewerStatus`, `onStatusChange: () => void`
- **Approve button:** Opens confirmation dialog:
  - Title: "Aprovar Avaliação"
  - Body: "O sistema irá regenerar o relatório e PDF com os dados atuais. Isso pode levar 30-60 segundos."
  - Input: "Seu nome" (text field for `approved_by`)
  - Actions: "Cancelar" / "Confirmar Aprovação"
  - On confirm: calls `useApproveEvaluationMutationHook`
  - **Loading state:** Replace dialog content with spinner + "Gerando relatório..." message. Disable close. This is critical because the API call takes 30-60 seconds.
  - On success: toast "Avaliação aprovada com sucesso", navigate to list
- **Reject button:** Opens dialog:
  - Title: "Rejeitar Avaliação"
  - Body: Textarea for rejection notes (required, min 10 chars)
  - Actions: "Cancelar" / "Confirmar Rejeição" (danger style)
  - On confirm: calls `useRejectEvaluationMutationHook`
  - On success: toast "Avaliação rejeitada", navigate to list

### ReportPreviewComponent

- **Props:** `markdown: string | null`, `pdfUrl: string | null`
- **Layout:** Section card with title "Relatório Gerado"
- If `markdown` is null: show "Relatório ainda não gerado" in dim text
- If `markdown` exists:
  - Render markdown as formatted HTML. Use a simple markdown renderer (install `react-markdown` or use a basic regex-based renderer for headers, bold, lists, horizontal rules).
  - Style: `surface2` bg, teal left border (3px), line-height 1.75 — matches HTML sketch `.report-text`
  - Section headers within the report: bold, navy/teal color
  - Bullet points: indented with teal dot
- If `pdfUrl` exists: Show "Baixar PDF" button (accent outline, opens in new tab)

---

## 3. Hooks to Build

### useEvaluationByIdQueryHook

```typescript
queryKey: ['portal', 'evaluations', id]
queryFn: GET /api/portal/evaluations/${id}
returns: { evaluation, isLoading, error, refetch }
```

### useUpdateEvaluationMutationHook

```typescript
mutationFn: PATCH /api/portal/evaluations/${id}
body: { form_data, scores, changed_by }
onSuccess: invalidate ['portal', 'evaluations', id]
```

### useApproveEvaluationMutationHook

```typescript
mutationFn: POST /api/portal/evaluations/${id}/approve
body: { approved_by }
onSuccess: invalidate ['portal', 'evaluations'] and ['portal', 'evaluations', id]
```

This mutation will have a longer timeout — the API call takes 30-60 seconds because it regenerates the AI report + PDF. The component must handle this with a loading state.

### useRejectEvaluationMutationHook

```typescript
mutationFn: POST /api/portal/evaluations/${id}/reject
body: { reviewer_notes }
onSuccess: invalidate ['portal', 'evaluations'] and ['portal', 'evaluations', id]
```

---

## 4. Key Implementation Details

### Score recomputation on edit

When a doctor edits clinical scale answers (e.g., changes a PHQ-9 item), the scores must be recomputed before saving:

```typescript
import { computeScores } from '~/features/assessment/helpers/compute-scores'

// After form changes:
const updatedScores = computeScores(updatedFormData)
```

Check the signature of `computeScores` in the existing codebase and adapt accordingly.

### Markdown rendering

For the report preview, the simplest approach is:

```typescript
// Option A: react-markdown (install if not present)
import ReactMarkdown from 'react-markdown'
<ReactMarkdown>{markdown}</ReactMarkdown>

// Option B: dangerouslySetInnerHTML with a basic converter
// Only if we want zero new dependencies. Acceptable since the markdown comes from our own AI pipeline.
```

### Long-running approval request

The approve endpoint takes 30-60 seconds. Handle this explicitly:

```typescript
const approveMutation = useApproveEvaluationMutationHook(evaluationId)

// In the dialog:
if (approveMutation.isPending) {
  return <LoadingSpinner message="Gerando relatório e PDF..." />
}
```

The TanStack Mutation will stay in `isPending` state until the API responds. No need for WebSocket or polling — the HTTP request just takes longer.

### Rejection notes display

When viewing a rejected evaluation, show the rejection notes prominently:

```tsx
{evaluation.reviewer_status === 'rejected' && evaluation.reviewer_notes && (
  <div className="bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.3)] rounded-lg p-4">
    <p className="text-xs uppercase tracking-wider text-[#ff6b85] mb-1">Motivo da Rejeição</p>
    <p className="text-sm text-[#cce6f7]">{evaluation.reviewer_notes}</p>
  </div>
)}
```

---

## 5. Phase Completion Checklist

- [ ] File created: `app/[locale]/portal/[id]/page.tsx`
- [ ] File created: `features/portal/components/EvaluationDetailPageComponent.tsx`
- [ ] File created: `features/portal/components/EvaluationDetailViewComponent.tsx`
- [ ] File created: `features/portal/components/EvaluationEditFormComponent.tsx`
- [ ] File created: `features/portal/components/ApprovalActionsComponent.tsx`
- [ ] File created: `features/portal/components/ReportPreviewComponent.tsx`
- [ ] File created: `features/portal/hooks/useEvaluationByIdQueryHook.ts`
- [ ] File created: `features/portal/hooks/useUpdateEvaluationMutationHook.ts`
- [ ] File created: `features/portal/hooks/useApproveEvaluationMutationHook.ts`
- [ ] File created: `features/portal/hooks/useRejectEvaluationMutationHook.ts`
- [ ] Verified: Detail page loads and displays all form sections
- [ ] Verified: Edit mode allows field changes
- [ ] Verified: Save persists changes to DB
- [ ] Verified: Score recomputation works when scales are edited
- [ ] Verified: Approve triggers full regeneration pipeline (report + PDF)
- [ ] Verified: New PDF URL is updated after approval
- [ ] Verified: Reject saves notes and updates status
- [ ] Verified: Status badges update after approval/rejection
- [ ] Verified: Loading states during approval (~30-60s)
- [ ] Verified: Back navigation returns to list with updated data

**Done.** Portal Comitê Médico is complete. Full cycle: code gate → list → detail → edit → approve/reject → regenerate.
