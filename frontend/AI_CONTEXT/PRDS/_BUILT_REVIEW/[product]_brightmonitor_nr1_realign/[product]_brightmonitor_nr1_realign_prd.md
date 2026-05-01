# BrightMonitor NR-1 Realignment — PRD

**Version:** 1.0
**Date:** 27 April 2026
**Status:** Implementation Ready

---

## 1. Overview

This PRD implements the realignment of BrightMonitor from the wrong clinical-scale form (SRQ-20/AEP/PHQ-9 as the B2B base flow) to the correct NR-1 risk-domain form (7 domains: Físico, Químico, Biológico, Ergonômico, Psicossocial, Acidentes, Percepção). It renames the API namespace from `b2b` to `brightmonitor`, adapts the existing dashboard tabs to read NR-1 domain scores, builds a 6-document PGR generator plus a 4-view AI analysis panel, and gates the existing clinical scales behind a `bright_insights_enabled` feature flag. Auth, dashboard shell, and CRUD APIs (action plans, events/incidents) stay as-is. Reference: `[product]_brightmonitor_nr1_realign_strategy.md`.

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Employee Browser                           │
│  /assessment?company=X  →  AssessmentPage (B2B mode)            │
│       │  if bright_insights_enabled:                            │
│       │    NR-1 steps (9)  +  Insights steps (PHQ/GAD/ISI/MBI) │
│       │  else:                                                  │
│       │    NR-1 steps (9) only                                  │
│       ▼                                                         │
│  POST /api/assessment/submit                                    │
│    ├── write ~40 NR-1 columns to mental_health_evaluations      │
│    ├── write incidents to b2b_events (if had_accident etc.)     │
│    ├── write anonymous row to harassment_reports (if report)    │
│    └── trigger b2b-laudo agent ONLY if bright_insights_enabled  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
        ┌────────────────────────────────────┐
        │   Supabase                         │
        │   mental_health_evaluations        │
        │     + 40 NR-1 columns              │
        │     + 5 computed domain scores     │
        │     + assessment_kind column       │
        │   harassment_reports (anon, new)   │
        │   b2b_events (existing)            │
        │   b2b_action_plans (existing)      │
        │   companies.bright_insights_enabled│
        └────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Company Admin Browser                          │
│   /empresa/dashboard  →  B2BDashboardComponent                     │
│       ├── Visão Geral    ◀── GET /api/brightmonitor/[id]/overview  │
│       ├── Setores        ◀── GET /api/brightmonitor/[id]/departments│
│       ├── GRO/Inventário ◀── GET /api/brightmonitor/[id]/gro      │
│       ├── Plano de Ação  ◀── CRUD /api/brightmonitor/[id]/action-plans│
│       ├── Incidentes     ◀── CRUD /api/brightmonitor/[id]/incidents│
│       ├── Compliance     ◀── GET /api/brightmonitor/[id]/compliance│
│       ├── Relatórios     ◀── POST /api/brightmonitor/[id]/reports/ │
│       │     ├── pgr/[slug]          (6 PGR documents)              │
│       │     └── analise-ia/[slug]   (4 AI analysis views)          │
│       ├── Insights*      ◀── * only if bright_insights_enabled     │
│       ├── Guia           ◀── static page                           │
│       └── Configurações  ◀── GET/POST .../settings                 │
└────────────────────────────────────────────────────────────────────┘
```

## 3. Core Principles & Architecture Decisions

1. **Bernardo's prototype is content reference, never code reference.** We lift form questions, PGR section structures, Guia HTML content. We do not lift his Netlify functions, auth scheme, or jsPDF helpers.

2. **Don't throw away what shipped.** Every existing B2B dashboard tab and API is reused. We adapt the data shape; we don't redo UI from scratch.

3. **NR-1 is the base; Insights is the paid add-on.** A single `bright_insights_enabled` boolean on `companies` controls whether the clinical scales appear in the form and the Insights tab appears in the dashboard.

4. **PGR keeps existing jspdf + KMR fonts + brand styling.** (Decision D1, locked.) We reuse `pdf-helpers.ts`'s `buildPdf()` with a variant header/footer for NR-1 documents. Content match, not pixel match to Bernardo's PDFs. ASSUMED — confirm with Oliver before Phase 5 starts; if client pushes back on visual fidelity, only then revisit layout.

5. **API namespace: `b2b` → `brightmonitor`.** (Decision D3, locked.) One-time cutover in Phase 0. Internal feature folder name `b2b-dashboard/` stays for now (cosmetic rename deferred).

6. **NR-1 base flow generates NO employee-facing report.** The current `b2b-laudo` LangGraph agent generates a clinical-style laudo that's irrelevant for NR-1-only assessments. For NR-1 base flow: employee fills form → data persists → dashboard shows aggregates → admin generates PGR. The b2b-laudo agent only runs when `bright_insights_enabled = true`. ASSUMED — confirm with Oliver before Phase 3 starts.

7. **`events` table stays as `b2b_events`; API uses "incidents".** (Open question Q2 resolution.) The table name `b2b_events` is not user-visible. The API route and UI label use "incidents" per NR-1 terminology. No table rename needed.

8. **Guia page: wholesale HTML copy for pilot, rewrite for GA.** (Open question Q3 resolution.)

9. **NR-1 inventory fields in Settings are nice-to-have for pilot.** PGR prompts handle missing fields gracefully with a warning banner. (Open question Q4 resolution.)

10. **B2B employee report deferred.** Not on the pilot critical path. (Open question Q5 resolution.)

11. **Insights scales for v1: PHQ-9 + GAD-7 + ISI + MBI.** Drop SRQ-20 and AEP from the Insights block — they were NR-1 instruments wrongly placed in the clinical flow. (Open question Q1 resolution.) ASSUMED — confirm with Oliver before Phase 6.

12. **Grupo econômico out of scope.** (Decision D6, locked.)

## 4. Directory Structure

```
frontend/
├── features/
│   ├── assessment/
│   │   ├── components/
│   │   │   ├── constants/
│   │   │   │   ├── steps.ts                          # MODIFY (Phase 2) — replace B2B_STEPS
│   │   │   │   └── nr1-options.ts                    # NEW (Phase 2) — select options, agent lists
│   │   │   ├── steps/
│   │   │   │   ├── nr1/                              # NEW directory (Phase 2)
│   │   │   │   │   ├── PerfilStep.tsx
│   │   │   │   │   ├── FisicoStep.tsx
│   │   │   │   │   ├── QuimicoStep.tsx
│   │   │   │   │   ├── BiologicoStep.tsx
│   │   │   │   │   ├── ErgonomicoStep.tsx
│   │   │   │   │   ├── PsicossocialStep.tsx
│   │   │   │   │   ├── AcidentesStep.tsx
│   │   │   │   │   └── PercepcaoNR1Step.tsx
│   │   │   │   └── B2BConsentsStep.tsx               # MODIFY (Phase 2) — single LGPD checkbox
│   │   │   ├── assessment.interface.ts               # MODIFY (Phase 2) — add ~40 NR-1 fields
│   │   │   └── AssessmentPage.tsx                    # MODIFY (Phase 2) — branch on insights flag
│   │   └── helpers/
│   │       └── compute-scores.ts                     # MODIFY (Phase 2) — NR-1 domain scoring
│   └── b2b-dashboard/
│       ├── b2b-dashboard.interface.ts                # MODIFY (Phase 4) — NR-1 response types
│       └── components/
│           ├── B2BDashboardComponent.tsx              # MODIFY (Phase 4) — tab rename + insights gate
│           └── tabs/
│               ├── B2BOverviewTab.tsx                # MODIFY (Phase 4) — NR-1 KPIs + radar
│               ├── B2BSetoresTab.tsx                 # MODIFY (Phase 4) — domain columns
│               ├── B2BGROTab.tsx                     # MODIFY (Phase 4) — NR-1 inventory focus
│               ├── B2BComplianceTab.tsx              # MODIFY (Phase 4) — recompute checklist
│               ├── B2BReportsTab.tsx                 # MODIFY (Phase 5) — PGR cards + Análise IA
│               ├── B2BPercepcaoTab.tsx               # MODIFY (Phase 6) — repurpose for Insights
│               └── B2BSettingsTab.tsx                # MODIFY (Phase 6) — insights toggle
├── app/
│   ├── api/
│   │   ├── assessment/
│   │   │   └── submit/route.ts                       # MODIFY (Phase 3) — NR-1 payload + incidents + harassment
│   │   └── brightmonitor/                            # RENAMED from b2b/ (Phase 0)
│   │       ├── signup/route.ts
│   │       ├── me/route.ts
│   │       ├── profile/route.ts
│   │       ├── lib/
│   │       │   ├── getB2BUser.ts                     # MOVED (Phase 0)
│   │       │   └── riskUtils.ts                      # MODIFY (Phase 4) — NR-1 domain scoring
│   │       └── [companyId]/
│   │           ├── overview/route.ts                 # MODIFY (Phase 4)
│   │           ├── departments/route.ts              # MODIFY (Phase 4)
│   │           ├── inventory/route.ts                # RENAMED from nr1-inventory/ (Phase 0)
│   │           ├── action-plans/                     # MOVED (Phase 0)
│   │           ├── incidents/                        # RENAMED from events/ (Phase 0)
│   │           ├── compliance/route.ts               # MODIFY (Phase 4)
│   │           ├── alerts/route.ts                   # MODIFY (Phase 4)
│   │           ├── gro/route.ts                      # MODIFY (Phase 4)
│   │           ├── domains/route.ts                  # RETIRE (Phase 4) — absorbed into gro
│   │           ├── settings/route.ts                 # MODIFY (Phase 6)
│   │           ├── percepcao/route.ts                # MODIFY (Phase 6) — repurpose for Insights
│   │           ├── departments/route.ts              # MOVED (Phase 0)
│   │           ├── employee-tracking/route.ts        # MOVED (Phase 0)
│   │           ├── extract-pdf/                      # MOVED (Phase 0)
│   │           └── reports/
│   │               ├── route.ts                      # MODIFY (Phase 5) — delete or stub
│   │               ├── pgr/[slug]/route.ts           # NEW (Phase 5)
│   │               ├── analise-ia/[slug]/route.ts    # NEW (Phase 5)
│   │               └── lib/
│   │                   ├── pgr-prompts.ts            # NEW (Phase 5)
│   │                   ├── analise-prompts.ts        # NEW (Phase 5)
│   │                   └── build-context.ts          # NEW (Phase 5)
│   └── [locale]/
│       └── brightmonitor/
│           └── guia/page.tsx                         # NEW (Phase 6)
```

## 5. Service & Agent Specifications

### 5.1 NR-1 Score Computation

**File:** `frontend/features/assessment/helpers/compute-scores.ts`

New exported functions (add alongside existing clinical scoring):

```typescript
/** Mean of 5 Likert physical fields. Returns null if all null. */
export function scorePhysical(data: AssessmentFormData): number | null;

/** Mean of 7 Likert ergonomic fields. */
export function scoreErgonomic(data: AssessmentFormData): number | null;

/** Mean of 8 psychosocial fields (excludes violence_level, harassment_level). */
export function scorePsychosocial(data: AssessmentFormData): number | null;

/** Mean of violence_level and harassment_level. */
export function scoreViolence(data: AssessmentFormData): number | null;

/** Mean of non-null domain scores (physical, ergonomic, psychosocial, violence). */
export function scoreOverall(domains: { physical: number | null; ergonomic: number | null; psychosocial: number | null; violence: number | null }): number | null;

/** Risk band: < 2 Baixo, 2-2.99 Moderado, 3-3.99 Alto, >= 4 Crítico */
export function getNR1RiskBand(score: number): 'baixo' | 'moderado' | 'alto' | 'critico';
```

### 5.2 PGR Context Aggregator

**File:** `frontend/app/api/brightmonitor/[companyId]/reports/lib/build-context.ts`

```typescript
interface PGRContext {
  company: { name: string; cnpj: string; cnae: string | null; departments: string[]; sst_responsible_name: string | null; /* ... */ };
  cycle: { label: string; starts_at: string; ends_at: string };
  assessmentCount: number;
  scores: { physical: number; ergonomic: number; psychosocial: number; violence: number; overall: number };
  scoresByDepartment: Record<string, { physical: number; ergonomic: number; psychosocial: number; violence: number; n: number }>;
  psychosocialAxes: Record<string, number>;  // 8-axis averages
  inventory: Array<{ id: string; description: string; risk_type: string; probability: string; severity: string; /* ... */ }>;
  actions: Array<{ description: string; status: string; responsible: string | null; deadline: string | null }>;
  incidents: { accidents: number; near_misses: number; work_diseases: number };
  harassmentCount: number;
  chemicalExposures: Record<string, number>;  // agent → count of employees exposed
  biologicalExposures: Record<string, number>;
}

/** Aggregates all data needed for PGR/Análise IA prompts. */
export async function buildPGRContext(companyId: string, cycleId: string): Promise<PGRContext>;
```

### 5.3 PGR Prompt Templates

**File:** `frontend/app/api/brightmonitor/[companyId]/reports/lib/pgr-prompts.ts`

6 exported prompt template functions, one per slug:

```typescript
export function getInventarioPrompt(ctx: PGRContext): { system: string; user: string };
export function getPlanoPrompt(ctx: PGRContext): { system: string; user: string };
export function getPsicossocialPrompt(ctx: PGRContext): { system: string; user: string };
export function getPGRCompletoPrompt(ctx: PGRContext): { system: string; user: string };
export function getAntiAssedioPrompt(ctx: PGRContext): { system: string; user: string };
export function getOSSSTPrompt(ctx: PGRContext): { system: string; user: string };
```

Each injects the context data and NR-1 article references into a structured system prompt. Section headers are borrowed from Bernardo's prototype; legal references match NR-1 §1.5.

### 5.4 Análise IA Prompt Templates

**File:** `frontend/app/api/brightmonitor/[companyId]/reports/lib/analise-prompts.ts`

```typescript
export function getAnaliseGeralPrompt(ctx: PGRContext): { system: string; user: string };
export function getAnalisePsicossocialPrompt(ctx: PGRContext): { system: string; user: string };
export function getAnaliseCriticosPrompt(ctx: PGRContext): { system: string; user: string };
export function getAnalisePriorizarPrompt(ctx: PGRContext): { system: string; user: string };
```

Output is in-page markdown, not PDF.

## 6. API Endpoints

### Renamed (Phase 0 — mechanical move)

| New Path | Old Path | Notes |
|---|---|---|
| `/api/brightmonitor/signup` | `/api/b2b/signup` | |
| `/api/brightmonitor/me` | `/api/b2b/me` | |
| `/api/brightmonitor/profile` | `/api/b2b/profile` | |
| `/api/brightmonitor/[id]/inventory` | `/api/b2b/[id]/nr1-inventory` | Renamed |
| `/api/brightmonitor/[id]/incidents` | `/api/b2b/[id]/events` | Renamed |
| `/api/brightmonitor/[id]/incidents/[eventId]` | `/api/b2b/[id]/events/[eventId]` | Renamed |
| `/api/brightmonitor/[id]/action-plans` | `/api/b2b/[id]/action-plans` | |
| `/api/brightmonitor/[id]/action-plans/[planId]` | `/api/b2b/[id]/action-plans/[planId]` | |
| `/api/brightmonitor/[id]/departments` | `/api/b2b/[id]/departments` | |
| `/api/brightmonitor/[id]/employee-tracking` | `/api/b2b/[id]/employee-tracking` | |
| `/api/brightmonitor/[id]/extract-pdf/*` | `/api/b2b/[id]/extract-pdf/*` | |

### Modified (Phase 4 — dashboard data adaptation)

| Method | Path | Change |
|---|---|---|
| `GET` | `/api/brightmonitor/[id]/overview` | Return NR-1 domain means, 8-axis psychosocial, risk bands instead of clinical scale averages |
| `GET` | `/api/brightmonitor/[id]/departments` | Add per-department NR-1 domain averages |
| `GET` | `/api/brightmonitor/[id]/gro` | Refocus to NR-1 risk inventory matrix; drop SRQ-20/AEP distributions |
| `GET` | `/api/brightmonitor/[id]/compliance` | Recompute checklist against NR-1 data |
| `GET` | `/api/brightmonitor/[id]/alerts` | Generate alerts from NR-1 domain thresholds |

### New (Phase 5 — reports)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/brightmonitor/[id]/reports/pgr/[slug]` | Generate one of 6 PGR documents. Slug: `inventario`, `plano`, `psicossocial`, `pgr-completo`, `anti-assedio`, `os-sst`. Returns `{ markdown, pdfUrl }`. |
| `POST` | `/api/brightmonitor/[id]/reports/analise-ia/[slug]` | Generate one of 4 AI analysis views. Slug: `geral`, `psicossocial`, `criticos`, `priorizar`. Returns `{ markdown }`. |

### Modified (Phase 3 — submit)

| Method | Path | Change |
|---|---|---|
| `POST` | `/api/assessment/submit` | Write NR-1 columns to `mental_health_evaluations`. Insert `b2b_events` rows for incidents. Insert anonymous `harassment_reports` row. Only trigger b2b-laudo when `bright_insights_enabled`. |

### Modified (Phase 6 — insights + settings)

| Method | Path | Change |
|---|---|---|
| `GET/POST` | `/api/brightmonitor/[id]/settings` | Expose and accept `bright_insights_enabled` toggle |
| `GET` | `/api/brightmonitor/[id]/percepcao` | Repurpose: return Insights-relevant data when flag is true |

## 7. Database Schema

### 7.1 Add NR-1 columns to `mental_health_evaluations`

```sql
ALTER TABLE mental_health_evaluations

  -- Perfil
  ADD COLUMN IF NOT EXISTS nr1_role TEXT,
  ADD COLUMN IF NOT EXISTS nr1_work_time TEXT,

  -- Físico (Likert 1-5)
  ADD COLUMN IF NOT EXISTS noise_level SMALLINT,
  ADD COLUMN IF NOT EXISTS temperature_level SMALLINT,
  ADD COLUMN IF NOT EXISTS lighting_level SMALLINT,
  ADD COLUMN IF NOT EXISTS vibration_level SMALLINT,
  ADD COLUMN IF NOT EXISTS humidity_level SMALLINT,

  -- Químico
  ADD COLUMN IF NOT EXISTS chemical_exposures TEXT[],
  ADD COLUMN IF NOT EXISTS chemical_details TEXT,

  -- Biológico
  ADD COLUMN IF NOT EXISTS biological_exposures TEXT[],
  ADD COLUMN IF NOT EXISTS biological_details TEXT,

  -- Ergonômico (Likert 1-5)
  ADD COLUMN IF NOT EXISTS posture_level SMALLINT,
  ADD COLUMN IF NOT EXISTS repetition_level SMALLINT,
  ADD COLUMN IF NOT EXISTS manual_force_level SMALLINT,
  ADD COLUMN IF NOT EXISTS breaks_level SMALLINT,
  ADD COLUMN IF NOT EXISTS screen_level SMALLINT,
  ADD COLUMN IF NOT EXISTS mobility_level SMALLINT,
  ADD COLUMN IF NOT EXISTS cognitive_effort_level SMALLINT,

  -- Psicossocial (Likert 1-5)
  ADD COLUMN IF NOT EXISTS workload_level SMALLINT,
  ADD COLUMN IF NOT EXISTS pace_level SMALLINT,
  ADD COLUMN IF NOT EXISTS autonomy_level SMALLINT,
  ADD COLUMN IF NOT EXISTS leadership_level SMALLINT,
  ADD COLUMN IF NOT EXISTS relationships_level SMALLINT,
  ADD COLUMN IF NOT EXISTS recognition_level SMALLINT,
  ADD COLUMN IF NOT EXISTS clarity_level SMALLINT,
  ADD COLUMN IF NOT EXISTS balance_level SMALLINT,
  ADD COLUMN IF NOT EXISTS violence_level SMALLINT,
  ADD COLUMN IF NOT EXISTS harassment_level SMALLINT,

  -- Acidentes (booleans + conditional text)
  ADD COLUMN IF NOT EXISTS had_accident BOOLEAN,
  ADD COLUMN IF NOT EXISTS accident_description TEXT,
  ADD COLUMN IF NOT EXISTS had_near_miss BOOLEAN,
  ADD COLUMN IF NOT EXISTS near_miss_description TEXT,
  ADD COLUMN IF NOT EXISTS had_work_disease BOOLEAN,
  ADD COLUMN IF NOT EXISTS work_disease_description TEXT,

  -- Percepção
  ADD COLUMN IF NOT EXISTS satisfaction_level SMALLINT,
  ADD COLUMN IF NOT EXISTS biggest_risk TEXT,
  ADD COLUMN IF NOT EXISTS suggestion TEXT,

  -- Computed domain scores (1.00-5.00 scale)
  ADD COLUMN IF NOT EXISTS score_physical NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_ergonomic NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_psychosocial NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_violence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_overall NUMERIC(3,2),

  -- Assessment classification
  ADD COLUMN IF NOT EXISTS assessment_kind TEXT NOT NULL DEFAULT 'nr1';

-- Constraint: assessment_kind values
ALTER TABLE mental_health_evaluations
  DROP CONSTRAINT IF EXISTS mental_health_evaluations_assessment_kind_check;
ALTER TABLE mental_health_evaluations
  ADD CONSTRAINT mental_health_evaluations_assessment_kind_check
  CHECK (assessment_kind IN ('nr1', 'insights', 'clinical'));

-- Index for company dashboard queries filtering by assessment_kind
CREATE INDEX IF NOT EXISTS idx_mhe_assessment_kind
  ON mental_health_evaluations(assessment_kind)
  WHERE assessment_kind = 'nr1';
```

### 7.2 Add `bright_insights_enabled` to `companies`

```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS bright_insights_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN companies.bright_insights_enabled
  IS 'Feature flag: when true, assessment form shows clinical scales (PHQ-9, GAD-7, ISI, MBI) and dashboard shows Insights tab';
```

### 7.3 Create `harassment_reports` table

```sql
CREATE TABLE IF NOT EXISTS harassment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES assessment_cycles(id),
  department TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE harassment_reports IS 'Anonymous harassment reports from NR-1 Acidentes step. No employee_id, no assessment_id — anonymity is structural.';

CREATE INDEX IF NOT EXISTS idx_harassment_reports_company
  ON harassment_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_harassment_reports_cycle
  ON harassment_reports(cycle_id);

-- RLS: company admin can SELECT count(*) and aggregate by department; CANNOT select individual rows with description.
-- The API route handles this restriction (returns only aggregates, never individual rows).
-- Service-role key bypasses RLS for writes from the submit endpoint.
ALTER TABLE harassment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY harassment_reports_insert_policy ON harassment_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY harassment_reports_select_aggregate ON harassment_reports
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );
```

### 7.4 Verify existing tables

These tables were created by the archived PRD and should exist:

- `b2b_action_plans` — CRUD for action plans. No schema change needed.
- `b2b_events` — Incidents/events. No schema change needed. API/UI call them "incidents"; table stays `b2b_events`.
- `b2b_percepcao_reports` — Canal de Percepção reports. Stays for existing data. New harassment reports go to `harassment_reports` (structurally anonymous, no evaluation_id link).

Phase 1's db-engineer must verify these tables exist in live Supabase before proceeding with new migrations.

## 8. Scheduled Tasks / Cron Jobs

None. All PGR generation is on-demand (user clicks "Gerar"). No background jobs or scheduled tasks in this PRD.

## 9. Configuration & Constants

```typescript
// frontend/features/assessment/components/constants/nr1-options.ts

export const WORK_TIME_OPTIONS = [
  '< 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', '> 10 anos'
] as const;

export const CHEMICAL_AGENTS = [
  'Solventes', 'Tintas/Vernizes', 'Ácidos', 'Bases', 'Combustíveis',
  'Pesticidas', 'Pó/Particulados', 'Gases tóxicos', 'Metais pesados', 'Outros'
] as const;

export const BIOLOGICAL_AGENTS = [
  'Bactérias', 'Vírus', 'Fungos', 'Sangue/fluidos', 'Animais',
  'Vegetais', 'Resíduos orgânicos', 'Outros'
] as const;

export const NR1_RISK_BANDS = {
  baixo:    { min: 0, max: 1.99, label: 'Baixo',    color: '#22c55e' },
  moderado: { min: 2, max: 2.99, label: 'Moderado',  color: '#eab308' },
  alto:     { min: 3, max: 3.99, label: 'Alto',      color: '#f97316' },
  critico:  { min: 4, max: 5.00, label: 'Crítico',   color: '#ef4444' },
} as const;

// PGR document slugs
export const PGR_SLUGS = [
  'inventario', 'plano', 'psicossocial', 'pgr-completo', 'anti-assedio', 'os-sst'
] as const;

export const ANALISE_IA_SLUGS = [
  'geral', 'psicossocial', 'criticos', 'priorizar'
] as const;
```

## 10. Error Handling Strategy

- **API routes:** Return `{ error: string }` with appropriate HTTP status. Existing `getB2BUser()` auth pattern stays.
- **PGR generation:** If Claude call fails, return `{ error, retryable: true }`. Frontend shows retry button. No partial markdown saved — the call is idempotent.
- **Assessment submit:** If incident/harassment inserts fail, log the error but do NOT fail the overall submission. The assessment data is the critical payload. Side-effect writes are best-effort with error logging.
- **NR-1 scoring:** Functions return `null` when all input fields are null. Dashboard components handle null scores with "—" placeholder.

## 11. Implementation Order

| Phase | Wave | Agent | Scope |
|---|---|---|---|
| 0 | 0 | /frontend-engineer | API namespace rename: `b2b/` → `brightmonitor/`, update all 46 consumers |
| 1 | 0 | /db-engineer | DB: add NR-1 columns, `bright_insights_enabled`, create `harassment_reports`, verify existing tables |
| 2 | 1 | /frontend-engineer | NR-1 form: 8 step components, scoring, interface, `AssessmentPage` branching |
| 3 | 2 | /frontend-engineer | Submit endpoint: write NR-1 columns + incidents + harassment, conditional report |
| 4 | 2 | /frontend-engineer | Dashboard data: adapt overview, departments, gro, compliance, alerts routes + tabs |
| 5 | 3 | /frontend-engineer | Reports: 6 PGR docs + 4 Análise IA views + prompts + build-context + Reports tab UI |
| 6 | 4 | /frontend-engineer | Insights flag wiring + settings toggle + Guia page + Insights tab repurpose |

Wave 0 runs first. Within a wave, phases run in parallel. Phase 3 depends on Phases 1+2. Phase 4 depends on Phase 0+1. Phase 5 depends on Phase 4. Phase 6 depends on Phase 0.

## 12. Dependencies

### External Packages (already installed)

- `jspdf` — PDF generation (existing, used by `pdf-helpers.ts`)
- `@anthropic-ai/sdk` — Claude API calls for PGR/Análise IA (existing)
- `@tanstack/react-query` — Server state management (existing)
- `recharts` — Charts for dashboard (existing, used by overview/gro tabs)
- `nuqs` — URL state for tab routing (existing)

### Existing Services Referenced

- `frontend/app/api/assessment/generate-pdf/pdf-helpers.ts` — `buildPdf()` for PGR PDF rendering
- `frontend/app/api/b2b/lib/getB2BUser.ts` → `frontend/app/api/brightmonitor/lib/getB2BUser.ts` — B2B auth
- `frontend/app/api/b2b/lib/riskUtils.ts` → `frontend/app/api/brightmonitor/lib/riskUtils.ts` — Score normalization
- `frontend/agents/b2b-laudo/` — LangGraph agent for B2B laudo (runs only when Insights enabled)

### Environment Variables

No new env vars. Existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` cover all functionality.

## 13. Future Enhancements

- **Feature folder rename:** `features/b2b-dashboard/` → `features/brightmonitor-dashboard/`. Deferred cosmetic cleanup.
- **Grupo econômico:** Multi-CNPJ hierarchy. Out of scope per D6.
- **PGR PDF visual refresh:** Custom layout matching client design expectations. Only if client requests it.
- **Employee-facing NR-1 summary:** Short report for the employee after form submission. Not on pilot critical path.
- **SRQ-20/AEP retirement:** Fully remove old clinical scales from B2B form once Insights module is built. Currently they exist in `B2B_STEPS` but will be replaced wholesale in Phase 2.
- **Table rename:** `b2b_events` → `incidents`, `b2b_action_plans` → `action_plans`. Cosmetic DB cleanup.
- **CSV/Excel exports:** Data exports from Reports tab. Deferred.
- **eSocial integration:** Compliance tab shows "Futuro". Deferred.
