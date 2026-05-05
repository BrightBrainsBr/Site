# BrightMonitor NR-1 — Phase 7: New Dashboard Tabs

**Cursor Agent:** /frontend-engineer
**Wave:** 2 (parallel with Phase 6)
**Objective:** Build the GRO Psicossocial, Plano de Ação, Eventos & Nexo, and Relatórios tabs. These are entirely new modules with CRUD capabilities.
**Depends on:** Phase 4 (new API routes), Phase 5 (modified APIs)

**Files owned by this phase:**
- `frontend/features/b2b-dashboard/components/tabs/B2BGROTab.tsx` (new)
- `frontend/features/b2b-dashboard/components/tabs/B2BActionPlanTab.tsx` (new)
- `frontend/features/b2b-dashboard/components/tabs/B2BEventsTab.tsx` (new)
- `frontend/features/b2b-dashboard/components/tabs/B2BReportsTab.tsx` (rewrite)
- `frontend/features/b2b-dashboard/hooks/useB2BGROQueryHook.ts` (new)
- `frontend/features/b2b-dashboard/hooks/useB2BActionPlansQueryHook.ts` (new)
- `frontend/features/b2b-dashboard/hooks/useB2BActionPlansMutationHook.ts` (new)
- `frontend/features/b2b-dashboard/hooks/useB2BEventsQueryHook.ts` (new)
- `frontend/features/b2b-dashboard/hooks/useB2BEventsMutationHook.ts` (new)
- `frontend/features/b2b-dashboard/hooks/useB2BPercepcaoQueryHook.ts` (new)
- `frontend/features/b2b-dashboard/hooks/useB2BNR1InventoryMutationHook.ts` (new)
- `frontend/features/b2b-dashboard/hooks/useB2BReportsMutationHook.ts` (new)

---

## 2. What to Build

### `B2BGROTab.tsx` — GRO Psicossocial

Match `BrightMonitor_Dashboard_NR1 (1).html` TabGRO layout.

**Sections:**
1. **Two-column top row:**
   - Left: Radar chart — clinical scale averages (PHQ-9, GAD-7, SRQ-20, PSS-10, MBI-EE, ISI). Single dataset (company average). No benchmark line for now.
   - Right: Horizontal bar chart — AEP 6 dimensions (average scores). Color-coded by risk level per dimension.

2. **SRQ-20 distribution panel:** 4 cards — Negativo (<8), Moderado (8-11), Elevado (12-16), Crítico (17-20) with counts. Reference note about SRQ-20 methodology.

3. **Risk matrix (3×4):** Probability (Alta/Média/Baixa) × Severity (Baixa/Moderada/Alta/Muito Alta). Each cell shows employee count. Color intensity by risk level. NR-1 reference at bottom.

**Data:** `useB2BGROQueryHook` → `/api/b2b/[companyId]/gro`

**Filter:** `B2BFilterBarComponent` with department filter (shows data for filtered departments only).

### `B2BActionPlanTab.tsx` — Plano de Ação (PDCA)

Match `BrightMonitor_Dashboard_NR1 (1).html` TabPlanoAcao layout + CRUD.

**Sections:**
1. **4 status counters:** Pendente (red), Em Andamento (yellow), Agendado (blue), Concluído (green)
2. **Action bar:** "+ Nova Ação" button, "Gerar com IA" button, filter pills
3. **Action list:** Each item shows:
   - Priority badge (critica/alta/media/baixa)
   - Description + sector subtitle
   - Responsible person
   - Deadline date
   - Status badge
   - Edit button → opens inline edit or modal

**CRUD:**
- Create: modal form with fields (description, department, priority, responsible, deadline, notes)
- AI Generate: button calls `POST /action-plans` with `generate: true` → creates 3-5 items based on GRO data → shows as new items with `ai_generated` badge
- Edit: inline or modal — all fields editable, status can be changed
- Delete: confirmation dialog

**Data:** `useB2BActionPlansQueryHook`, `useB2BActionPlansMutationHook`

### `B2BEventsTab.tsx` — Eventos & Nexo Causal

Match `BrightMonitor_Dashboard_NR1 (1).html` TabEventos layout + CRUD.

**Sections:**
1. **3 KPI cards:** Afastamentos CID-F (90d), Dias Perdidos (total), Relatos Canal
2. **Action bar:** "+ Novo Evento", "Upload PDF (lote)", CID code reference note
3. **Event list:** Each row shows:
   - Date (monospace)
   - Type badge (Afastamento = red, Relato Canal = yellow, Acidente = orange)
   - CID code (monospace, color-coded)
   - Description
   - Sector
   - Days lost (if applicable)

**CRUD:**
- Create: form with date picker, event type select, CID code picker (searchable list), description, department select, days lost (conditional on type=afastamento)
- Bulk import: "Upload PDF" → `B2BPdfUploadComponent` with `extractionType='events-bulk'` → extracted events shown for review → confirm → bulk POST
- Edit/Delete: standard pattern

**Data:** `useB2BEventsQueryHook`, `useB2BEventsMutationHook`

### `B2BReportsTab.tsx` — Relatórios (Rewrite)

Delete all existing hardcoded buttons and fake data. Build real report generation.

**Sections:**
1. **`B2BFilterBarComponent`** at top — filters apply to all generated reports
2. **Report cards** (grid layout, 3 per row):
   - **GRO Consolidado PDF**: snapshot of dashboard data for audit
   - **Relatório por Departamento**: per-department breakdown
   - **Exportação CSV**: raw evaluation data
   - **Inventário de Riscos NR-1**: 9-field mandatory document

Each card: title, description, "Gerar" button → loading state → download link.

3. **NR-1 Inventory section** (prominent, separate from other reports):
   - Shows status: last generated date, or "Não gerado"
   - "Gerar Inventário NR-1" button
   - Shows warning if 3 company fields are missing (redirects to Settings)

**Data:** `useB2BReportsMutationHook`, `useB2BNR1InventoryMutationHook`

### Hook Implementations

All hooks follow the TanStack Query pattern from `frontend/AI_CONTEXT/core_context/frontend_system_blueprint.md`.

**Query hooks** (`useQuery`):
- `useB2BGROQueryHook(companyId, cycle?)` → `GET /api/b2b/[companyId]/gro?cycle=`
- `useB2BActionPlansQueryHook(companyId, filters?)` → `GET /api/b2b/[companyId]/action-plans?status=&department=`
- `useB2BEventsQueryHook(companyId, filters?)` → `GET /api/b2b/[companyId]/events?type=&department=&from=&to=`
- `useB2BPercepcaoQueryHook(companyId, cycle?)` → `GET /api/b2b/[companyId]/percepcao`

**Mutation hooks** (`useMutation` + `queryClient.invalidateQueries`):
- `useB2BActionPlansMutationHook(companyId)` → create/update/delete + invalidate `['b2b', companyId, 'action-plans']`
- `useB2BEventsMutationHook(companyId)` → create/update/delete/bulk + invalidate `['b2b', companyId, 'events']`
- `useB2BNR1InventoryMutationHook(companyId)` → generate + invalidate
- `useB2BReportsMutationHook(companyId)` → generate report with filters

## 3. Phase Completion Checklist

- [ ] Created: `B2BGROTab.tsx` with radar, AEP bars, SRQ-20 distribution, risk matrix
- [ ] Created: `B2BActionPlanTab.tsx` with CRUD + AI generation
- [ ] Created: `B2BEventsTab.tsx` with CRUD + PDF bulk import
- [ ] Rewritten: `B2BReportsTab.tsx` with real report generation + NR-1 inventory
- [ ] Created: all 8 new hooks (4 query + 4 mutation)
- [ ] All tabs use `B2BFilterBarComponent`
- [ ] AI action plan generation works end-to-end
- [ ] PDF bulk import for events works end-to-end
- [ ] No hardcoded data in any tab

**Next:** `PHASE_8_nr1_settings_pdf_extraction.md` — Settings extensions + PDF upload pipeline UI
