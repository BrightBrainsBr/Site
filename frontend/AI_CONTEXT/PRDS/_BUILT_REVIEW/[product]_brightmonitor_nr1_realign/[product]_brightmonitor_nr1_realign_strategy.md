# BrightMonitor NR-1 Realignment — Strategy PRD

**Version:** 1.0
**Date:** 27 April 2026
**Author:** Oliver + AI
**Status:** Strategy Draft — Refine before implementation detail

---

> **The B2B NR-1 product was half-built against the wrong form.** The `[product]_b2b_nr1_compliance` PRD shipped most of the dashboard tabs and APIs, but never migrated the assessment form — it still asks PHQ-9 / GAD-7 / SRQ-20 / AEP. The client now confirms (Apr 15 call) that those clinical scales are NOT the NR-1 base flow; they belong to a paid add-on called **Bright Insights**. Bernardo built a separate prototype with the correct NR-1 form (7 risk domains) and a Claude-powered PGR document generator. **This strategy realigns our codebase to that direction**: swap the B2B form, adapt the dashboards that already exist to read the new payload, build a real PGR/document generator on top of our existing AI + PDF pipeline, and gate the existing clinical scales behind a feature flag. Auth and the bulk of the dashboard tabs stay as-is.

---

## 1. The Problem

What's broken today, in concrete terms:

- **The B2B form is wrong.** `frontend/features/assessment/components/constants/steps.ts:5-18` defines `B2B_STEPS` as the Bright Precision clinical battery (SRQ-20, PHQ-9, GAD-7, PSS-10, MBI, ISI, AEP, Canal de Percepção). Per the client on Apr 15: "a gente pediu errado [...] não tem nada a ver com NR." The actual NR-1 base flow is 7 risk-domain assessments (Físico, Químico, Biológico, Ergonômico, Psicossocial, Acidentes, Percepção) plus a Perfil step. None of those exist as form steps in our code.

- **The dashboard reads a payload that won't arrive.** Tabs like `B2BPercepcaoTab`, `B2BGROTab`, `B2BAlertsTab`, `B2BReportsTab` were built against the old strategy's data shape (SRQ-20 categories, AEP dimensions). Once we swap the form, they have nothing to chart unless adapted.

- **PGR generation is the headline feature, and it doesn't really exist.** The client's exact words in the call: *"essa página aqui ela é a mais importante de todas."* Bernardo's prototype produces 6 distinct legal documents (PGR completo, Inventário, Plano de Ação 5W2H, Laudo Psicossocial, Política Anti-Assédio, OS-SST) via Claude prompts that inject inventory + actions + assessment counts. We have an AI report pipeline (`app/api/assessment/continue-report`) and a PDF generator (`app/api/assessment/generate-pdf/pdf-helpers.ts`, jspdf), but they're targeted at the clinical Bright Precision laudo, not the NR-1 PGR documents.

- **Mental health was wired into the base flow when it should be optional.** The client's pricing model is: NR-1 is the base product; Bright Insights (PHQ-9 / GAD-7 / ISI / MBI / etc.) is a paid add-on. Today it's all one form. Need a feature flag at the company level.

- **The "Guia" page doesn't exist.** Bernardo has a 134KB static methodology / how-to page that the client wants embedded in the dashboard so the RH user understands the methodology. Pure content, no logic.

- **Half the previous PRD already shipped.** The dashboard shell, Setores, GRO, Compliance, ActionPlan, Events, Percepcao, Reports, Settings tabs all exist (`frontend/features/b2b-dashboard/components/tabs/`). All the support APIs exist (`nr1-inventory`, `action-plans`, `events`, `gro`, `percepcao`, `compliance`, `employee-tracking`). Throwing them out and starting over from Bernardo's HTML would be wasteful — but blindly trusting them is also wrong, because they were designed for the old form's data.

**Cost of inaction:** the deployed product asks the wrong questions, so even a sympathetic pilot company sees clinical mental-health screening when they expected NR-1 risk assessment. The client cannot demo this to anyone.

**Client context:** AI-generated prototype, "shitty code" (Oliver's words), being treated as **design inspiration, not best-practice reference**. We apply our own engineering standards. We don't migrate to Bernardo's auth (CNPJ + employee_code), schema, or jsPDF helpers — we keep our domain-based auth, our existing tables, and our existing AI/PDF pipeline.

**Goal:** pilot-ready version as fast as possible. Speed beats polish.

---

## 2. Current State Analysis

### What Exists Today

| Asset | File / Location | Status | Details |
|---|---|---|---|
| B2B assessment form (steps) | `frontend/features/assessment/components/constants/steps.ts` | **Wrong content** | `B2B_STEPS` lists clinical scales — must be replaced wholesale |
| B2B step components | `frontend/features/assessment/components/steps/SRQ20Step.tsx`, `AEPStep.tsx`, `CanalPercepcaoStep.tsx`, `B2BConsentsStep.tsx`, `PersonalDataStep.tsx` | Live | These will be retired from the B2B base flow. SRQ-20/AEP/etc. move to the Bright Insights module |
| Score helpers | `frontend/features/assessment/helpers/compute-scores.ts` | Live | Needs new score functions for the 7 NR-1 domains; existing clinical score functions stay for Insights |
| Form data shape | `frontend/features/assessment/components/assessment.interface.ts` | Live | `AssessmentFormData` needs ~40 new NR-1 fields; old SRQ-20/AEP fields stay (used by Insights) |
| AssessmentPage entry | `frontend/features/assessment/components/AssessmentPage.tsx` | Live | Branches on `companyContext`; needs to also branch on `bright_insights_enabled` |
| Submit endpoint | `frontend/app/api/assessment/submit/route.ts` | Live | Needs to write the new NR-1 payload to `risk_assessments` (or our equivalent) |
| AI report pipeline | `frontend/app/api/assessment/continue-report/route.ts`, `frontend/app/api/assessment/lib/report-prompts.ts` | Live | Targets clinical Bright Precision report. We extend it (or fork) for NR-1 documents |
| PDF generator | `frontend/app/api/assessment/generate-pdf/pdf-helpers.ts` | Live | jspdf with KMR fonts + Bright Precision footer. Reusable for NR-1 PGR with content swap; layout overhaul is harder |
| B2B dashboard shell | `frontend/features/b2b-dashboard/components/B2BDashboardComponent.tsx` | Live | Tab router stays |
| B2BOverviewTab | `.../tabs/B2BOverviewTab.tsx` | **Stale data shape** | Reads `GET /api/b2b/[id]/overview` — that API computes from clinical scales today. Needs to swap to NR-1 domain means + radar psicossocial |
| B2BSetoresTab | `.../tabs/B2BSetoresTab.tsx` | **Stale data shape** | Per-department breakdown — needs columns for NR-1 domain scores |
| B2BGROTab | `.../tabs/B2BGROTab.tsx` | **Misaligned** | Built for SRQ-20 + AEP. Refocus to "Inventário de Riscos NR-1" using `risk_inventory` (P×S matrix) |
| B2BActionPlanTab | `.../tabs/B2BActionPlanTab.tsx` | **Mostly fine** | Already CRUD on `action_plans`. Minor: link to inventory items |
| B2BComplianceTab | `.../tabs/B2BComplianceTab.tsx` | **Mostly fine** | Computed status |
| B2BReportsTab | `.../tabs/B2BReportsTab.tsx` | **Empty** | Needs the 6 PGR document generation cards |
| B2BEventsTab | `.../tabs/B2BEventsTab.tsx` | **Mostly fine** | CRUD on `events` / incidents — confirm naming aligns ("Incidentes" per Bernardo) |
| B2BPercepcaoTab | `.../tabs/B2BPercepcaoTab.tsx` | **To be retired or repurposed** | Built for old Canal de Percepção. The new NR-1 form has a Percepção step + Acidentes harassment_reports — repurpose this tab to surface those |
| B2BSettingsTab | `.../tabs/B2BSettingsTab.tsx` | **Mostly fine** | Adds `bright_insights_enabled` toggle + NR-1 inventory fields |
| B2B APIs | `frontend/app/api/b2b/[companyId]/{overview,setores,gro,compliance,alerts,reports,settings,nr1-inventory,action-plans,events,gro,percepcao,employee-tracking}/route.ts` | Live | Most stay. Aggregation queries (`overview`, `setores`, `gro`, `alerts`) need to read NR-1 domain scores from `risk_assessments` instead of clinical scales |
| Auth — domain-based | `frontend/app/api/b2b/signup/route.ts`, `app/api/b2b/me/route.ts` | Live | **Stays as-is.** Decided on the call. |
| Bernardo's prototype | `claude_artifact/teste-monitor-brightbrains/` | Reference only | Static HTML + Netlify functions + Anthropic SDK. **Inspiration, not source of truth.** |
| DB migration draft | Was in old PRD (`PHASE_1_nr1_database_migrations.md`, archived) | **Reusable** | Defines `risk_inventory`, `action_plans`, `incidents`, `harassment_reports`, NR-1 fields on `risk_assessments`. Verify against current Supabase before re-running. |

### What's Missing

- ❌ **NR-1 form steps** — 8 step components (Perfil, Físico, Químico, Biológico, Ergonômico, Psicossocial, Acidentes, Percepção). Plus consent step rewrite.
- ❌ **NR-1 score computation** — domain means + violência composite + overall mean (formulas in section 5).
- ❌ **NR-1 form data fields** on `AssessmentFormData` and DB row (~40 columns).
- ❌ **Bright Insights feature flag** at company level, gating which scales appear in the form and which dashboard tabs are visible.
- ❌ **PGR document generator** — 6 document types via Claude, each with its own prompt template, each producing markdown → PDF.
- ❌ **"Análise IA" 4-view panel** — Geral / Psicossocial / Críticos / Priorizar (Bernardo has it; client called it out as scope-worthy).
- ❌ **Guia static page** — Next.js page absorbing Bernardo's `guia.html` content.
- ❌ **Adapter logic in existing dashboard APIs** to read NR-1 domain scores instead of clinical scale scores.
- ❌ **`harassment_reports` table + write path** from the form's Acidentes step.

### Out of Scope (confirmed)

- ❌ **Grupo econômico** (multi-CNPJ hierarchy) — Bernardo has it; client did not prioritize for the pilot.
- ❌ **Bernardo's auth flow** (CNPJ + employee_code + admin_code per-table passwords). We keep domain-based auth.
- ❌ **Bernardo's `economic_groups` / `pgr_documents` tables** — not migrating his schema.
- ❌ **Demo/Real toggle** in the dashboard. Pilot uses real data.
- ❌ **Insights as a separate URL/app** (Bernardo splits NR-1 and Insights into different HTML files). We integrate into one app, gated by feature flag.

---

## 3. The Vision / Solution

### Core Principles

1. **Bernardo's repo is design + content reference, never code reference.** Lift the form questions, the document section structures, the dashboard KPI ideas, the Guia HTML content. Do not lift his Netlify functions, jsPDF helpers, or Supabase queries.
2. **Don't throw away what shipped.** Every B2B dashboard tab and API in our codebase is reused. We adapt data shape; we don't redo UI.
3. **NR-1 is the base; Insights is the add-on.** One assessment app, one dashboard. A `bright_insights_enabled` flag on the company controls visibility of the optional clinical block (PHQ-9 / GAD-7 / ISI / MBI / etc.) in the form and the "Insights" section in the dashboard.
4. **Auth stays domain-based.** Decided on the call, not revisited.
5. **PGR generation > everything else.** It's the demo trump card. Budget aggressively. Ship simpler tabs first, leave headroom for prompt iteration.
6. **Match Bernardo's PGR section structure, not his PDF visuals.** Keep our jspdf template + KMR fonts + branded header/footer. Building report layouts in HTML→PDF is hours of CSS pain we've already paid for once. The differentiator is *correct NR-1 sections*, not visual fidelity. Confirm with client before Phase 5 starts; if they push back, only then we revisit layout.
7. **API namespace matches the product, not the billing model.** The customer-facing product is **BrightMonitor** (NR-1 base) with **Bright Insights** as a paid module. Our current `/api/b2b/*` slug is a billing concept and a leak of our internal vocabulary. We rename `b2b` → `brightmonitor` across API routes (and matching dashboard hooks), with Insights as a sub-namespace under it. Detail in §10 + §11.
8. **Pilot-ready beats feature-complete.** Anything not on the critical path for a pilot demo is deferred.

### North Star

A friendly company can be onboarded in <30 minutes by a Bright Brains admin: domain configured, employees invited via email, employees complete the NR-1 form, dashboard shows real KPIs, admin clicks "Gerar PGR" and downloads a legally-coherent NR-1 PGR PDF.

### Key Capabilities

1. **NR-1 base assessment form** — 9 steps, ~40 fields, validated, scored, persisted.
2. **NR-1 domain dashboard** — KPIs, radar (psicossocial 8-axis), domain bar chart, per-department breakdown — all driven by the new `risk_assessments` columns.
3. **PGR document hub** — 6 document types generated via Claude, exported to PDF.
4. **Análise IA panel** — 4 angled views (Geral / Psicossocial / Críticos / Priorizar) over the same dataset.
5. **Bright Insights toggle** — feature flag gating clinical mental-health module.
6. **Guia page** — embedded methodology content, static.

---

## 4. The System (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Employee Browser                           │
│                                                                 │
│  /assessment?company=X  →  AssessmentPage (B2B mode)            │
│       │                                                         │
│       │  if bright_insights_enabled:                            │
│       │    NR-1 steps (9)  +  Insights steps (PHQ/GAD/ISI/MBI)  │
│       │  else:                                                  │
│       │    NR-1 steps (9) only                                  │
│       ▼                                                         │
│  POST /api/assessment/submit                                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
        ┌────────────────────────────────────┐
        │   Supabase                         │
        │   risk_assessments                 │
        │     - 40 NR-1 columns              │
        │     - 8 domain scores              │
        │     - optional clinical scores     │
        │   harassment_reports (anon)        │
        │   incidents (logged separately)    │
        │   action_plans                     │
        │   risk_inventory                   │
        │   companies.bright_insights_enabled│
        └────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Company Admin Browser                          │
│                                                                    │
│   /brightmonitor  →  BrightMonitorDashboardComponent               │
│       ├── Visão Geral   ◀──  GET /api/brightmonitor/[id]/overview  │
│       │                       (NR-1 domain means, radar, bars)     │
│       ├── Setores       ◀──  GET /api/brightmonitor/[id]/setores   │
│       ├── Inventário    ◀──  GET /api/brightmonitor/[id]/inventory │
│       ├── Plano Ação    ◀──  GET /api/brightmonitor/[id]/action-plans│
│       ├── Incidentes    ◀──  GET /api/brightmonitor/[id]/incidents │
│       ├── Compliance    ◀──  GET /api/brightmonitor/[id]/compliance│
│       ├── Relatórios    ◀──  /api/brightmonitor/[id]/reports/pgr/[slug]│
│       │                       /api/brightmonitor/[id]/reports/analise-ia/[slug]│
│       ├── Insights*     ◀──  GET /api/brightmonitor/[id]/insights/* │
│       │                       (* visible iff bright_insights_enabled)│
│       ├── Guia          ◀──  static page                           │
│       └── Configurações ◀──  GET/POST /api/brightmonitor/[id]/settings│
│                                                                    │
│   PGR generation flow:                                             │
│       Click "Gerar PGR" → POST /api/b2b/[id]/reports/pgr           │
│         → builds context (assessments + inventory + actions)       │
│         → calls Claude via existing assessment AI helper           │
│         → markdown response + jspdf via existing pdf-helpers       │
│         → returns signed URL or streams PDF                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. The NR-1 Form (Field-Level Spec)

This section is the contract between this strategy and the implementation. Field names map directly to columns on `risk_assessments`.

### Step 0 — Consent (B2BConsentsStep, rewritten)

| Field | Type | Required |
|---|---|---|
| `lgpd_consent` | bool | yes |

Copy: LGPD compliance text + anonymized data usage statement. (Replace the current 3-checkbox version that mixed B2B + B2C consents.)

### Step 1 — Perfil (new)

| Field | Type | Source | Required |
|---|---|---|---|
| `department` | select | `companies.departments` array | yes |
| `role` | text | free | yes |
| `work_time` | select | `< 1 ano`, `1-3 anos`, `3-5 anos`, `5-10 anos`, `> 10 anos` | yes |

### Step 2 — Físico (5 Likert, 1-5)

`noise_level`, `temperature_level`, `lighting_level`, `vibration_level`, `humidity_level`

**Score:** `score_physical = mean(5 fields)`

### Step 3 — Químico

| Field | Type |
|---|---|
| `chemical_exposures` | string[] (multi-select, 10 agents: Solventes, Tintas/Vernizes, Ácidos, Bases, Combustíveis, Pesticidas, Pó/Particulados, Gases tóxicos, Metais pesados, Outros) |
| `chemical_details` | textarea |

No domain score — feeds inventory + AI context.

### Step 4 — Biológico

| Field | Type |
|---|---|
| `biological_exposures` | string[] (multi-select, 8 agents: Bactérias, Vírus, Fungos, Sangue/fluidos, Animais, Vegetais, Resíduos orgânicos, Outros) |
| `biological_details` | textarea |

No domain score — feeds inventory + AI context.

### Step 5 — Ergonômico (7 Likert, 1-5)

`posture_level`, `repetition_level`, `manual_force_level`, `breaks_level`, `screen_level`, `mobility_level`, `cognitive_effort_level`

**Score:** `score_ergonomic = mean(7 fields)`

### Step 6 — Psicossocial (10 Likert, 1-5)

`workload_level`, `pace_level`, `autonomy_level`, `leadership_level`, `relationships_level`, `recognition_level`, `clarity_level`, `balance_level`, `violence_level`, `harassment_level`

**Scores:**
- `score_psychosocial = mean(workload, pace, autonomy, leadership, relationships, recognition, clarity, balance)` — 8 of 10 (intentionally excludes violence/harassment per Bernardo's formula)
- `score_violence = mean(violence_level, harassment_level)` — separate axis, surfaces alerts independently

### Step 7 — Acidentes

| Field | Type | Conditional |
|---|---|---|
| `had_accident` | bool | — |
| `accident_description` | textarea | shown if `had_accident` |
| `had_near_miss` | bool | — |
| `near_miss_description` | textarea | shown if `had_near_miss` |
| `had_work_disease` | bool | — |
| `work_disease_description` | textarea | shown if `had_work_disease` |
| `report_harassment` | bool | — |
| `harassment_report_description` | textarea | shown if `report_harassment` |

`report_harassment` writes a separate **anonymous** row to `harassment_reports` table — NOT linked to user identity, NOT visible per-row to admin (only aggregate count).

`had_accident` / `had_near_miss` / `had_work_disease` write to `incidents` table linked to the assessment.

### Step 8 — Percepção

| Field | Type |
|---|---|
| `satisfaction_level` | Likert 1-5 |
| `biggest_risk` | text |
| `suggestion` | textarea |

### Computed Overall

`score_overall = mean(score_physical, score_ergonomic, score_psychosocial, score_violence)` — nulls dropped.

Risk band labels: `< 2` Baixo, `2-2.99` Moderado, `3-3.99` Alto, `>= 4` Crítico (matches Bernardo's bands; aligns with NR-1 risk classification language).

---

## 6. Database Schema Changes

This section is **inherited from the archived `PHASE_1_nr1_database_migrations.md`**. Verify against live Supabase before re-running. Approximate diff:

### `risk_assessments` (or our equivalent — currently `mental_health_evaluations` per the archived strategy)

Add columns:

```sql
-- Perfil
role TEXT,
work_time TEXT,
-- (department already exists as employee_department)

-- Físico
noise_level SMALLINT, temperature_level SMALLINT, lighting_level SMALLINT,
vibration_level SMALLINT, humidity_level SMALLINT,

-- Químico / Biológico
chemical_exposures TEXT[], chemical_details TEXT,
biological_exposures TEXT[], biological_details TEXT,

-- Ergonômico
posture_level SMALLINT, repetition_level SMALLINT, manual_force_level SMALLINT,
breaks_level SMALLINT, screen_level SMALLINT, mobility_level SMALLINT,
cognitive_effort_level SMALLINT,

-- Psicossocial
workload_level SMALLINT, pace_level SMALLINT, autonomy_level SMALLINT,
leadership_level SMALLINT, relationships_level SMALLINT,
recognition_level SMALLINT, clarity_level SMALLINT, balance_level SMALLINT,
violence_level SMALLINT, harassment_level SMALLINT,

-- Acidentes
had_accident BOOL, accident_description TEXT,
had_near_miss BOOL, near_miss_description TEXT,
had_work_disease BOOL, work_disease_description TEXT,

-- Percepção
satisfaction_level SMALLINT, biggest_risk TEXT, suggestion TEXT,

-- Computed scores
score_physical NUMERIC(3,2), score_ergonomic NUMERIC(3,2),
score_psychosocial NUMERIC(3,2), score_violence NUMERIC(3,2),
score_overall NUMERIC(3,2),

-- Flags
assessment_kind TEXT NOT NULL DEFAULT 'nr1' -- 'nr1' | 'insights' | 'clinical'
```

Existing clinical-scale columns (`srq20_answers`, `aep_answers`, `phq9_score`, etc.) **stay** — populated only when the assessment includes the Insights block.

### `companies`

```sql
ALTER TABLE companies
  ADD COLUMN bright_insights_enabled BOOL NOT NULL DEFAULT false;
```

### `harassment_reports` (new)

```sql
CREATE TABLE harassment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES assessment_cycles(id),
  department TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: company admin can SELECT count(*) and aggregate by department; CANNOT select individual rows.
-- Write path: anonymous insert from /api/assessment/submit when report_harassment=true.
-- No employee_id, no assessment_id link — anonymity is structural.
```

### `incidents` (verify if exists)

If `events` table is the equivalent, reuse it. Otherwise:

```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES assessment_cycles(id),
  assessment_id UUID REFERENCES risk_assessments(id),
  type TEXT NOT NULL CHECK (type IN ('accident','near_miss','work_disease')),
  description TEXT NOT NULL,
  department TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  investigated BOOL NOT NULL DEFAULT false,
  root_cause TEXT
);
```

### `risk_inventory` and `action_plans`

Already exist. No schema change anticipated. Inventory items may newly link to assessment-derived risks (FK column already present per archived PRD).

---

## 7. PGR Document Generation (the main cost center)

### Six document types (mirroring Bernardo)

| Slug | Title | NR-1 reference | Source data |
|---|---|---|---|
| `inventario` | Inventário de Riscos | § 1.5.4 | `risk_inventory` rows for company |
| `plano` | Plano de Ação 5W2H | § 1.5.5 | `action_plans` rows |
| `psicossocial` | Laudo Psicossocial | § 1.5.3.2.1 | aggregated psychosocial scores + AEP/SRQ if Insights |
| `pgr_completo` | PGR Completo | § 1.5 | inventory + actions + assessment aggregates + incidents |
| `anti_assedio` | Política Anti-Assédio | § 1.4.1.1 + Portaria | template + harassment_reports aggregate |
| `os_sst` | Ordem de Serviço SST | § 1.4.1 c | per-role hazards from inventory |

### Pipeline

```
POST /api/b2b/[id]/reports/[slug]
  ├── Build context object: { company, cycle, assessmentCount, scores, inventory, actions, incidents, harassmentCount }
  ├── Resolve prompt template by slug (frontend/app/api/b2b/[companyId]/reports/lib/pgr-prompts.ts)
  ├── Call existing AI helper (Anthropic via OpenRouter, same client as continue-report)
  ├── Receive markdown response
  ├── Optionally render to PDF via existing pdf-helpers.buildPdf() with NR-1 footer variant
  └── Return { markdown, pdfUrl } or stream
```

### Why we keep our infra and only borrow Bernardo's prompt structure

- Our `report-prompts.ts` already implements multi-stage prompting with section structure, JSON validation guards, and OpenRouter fallback. Bernardo's `callAI` is a 30-line Netlify function with `max_tokens: 1500` and zero retry logic. Our infra is strictly better.
- Our `pdf-helpers.ts` has KMR fonts, branded header/footer, A4 markdown parser. Bernardo's `BrightPDF.gerarDocumentoPGR` is jsPDF with paragraph wrap. Lifting his layout would mean abandoning our brand fonts.
- The **content** of his prompts (section headers, NR article references, JSON shape of injected data) is what we borrow — that's the legally-meaningful part.

### Análise IA panel

Same pipeline, smaller prompts, 4 angles:

| Slug | Question to LLM |
|---|---|
| `geral` | "Resumo executivo do panorama NR-1 da empresa" |
| `psicossocial` | "Foco em fatores psicossociais e violência/assédio" |
| `criticos` | "Liste os 5 riscos mais críticos e justifique" |
| `priorizar` | "Sugira ordenação das 10 ações pendentes mais urgentes" |

Output is in-page text (markdown), not PDF.

---

## 8. Bright Insights Feature Flag

Single source of truth: `companies.bright_insights_enabled`.

| Surface | Behavior when flag = false | When flag = true |
|---|---|---|
| `AssessmentPage` (B2B) | NR-1 steps only (9) | NR-1 steps + Insights block (PHQ-9, GAD-7, ISI, MBI, optionally SRQ-20, PSS-10) appended after Percepção |
| Dashboard nav | No "Insights" tab | "Insights" tab visible (already exists structurally — was `B2BPercepcaoTab` etc., now repurposed) |
| Submit endpoint | Stores NR-1 columns only | Stores NR-1 + clinical columns |
| PGR `psicossocial` doc | Uses NR-1 psychosocial means | Uses NR-1 + clinical scales as triangulation |

The flag is checked at:
- Form load (`AssessmentPage` reads from `companyContext`)
- Submit (validates payload shape against flag)
- Dashboard tab gating (`B2BDashboardComponent` renders conditionally)

Bright Brains admins set the flag in `Configurações` → company management.

---

## 9. Dashboard Adaptation

### Tabs that need work

| Tab | Verdict | Work |
|---|---|---|
| Visão Geral | **Adapt** | Swap KPIs to: Avaliações Realizadas, Score Médio (1-5), Ações Pendentes, Incidentes no Período. Add radar (8-axis psicossocial). Add bar chart by domain. Inline alerts list. Update `GET /api/b2b/[id]/overview` to compute over new columns. |
| Setores | **Adapt** | Per-department table gains 4 columns: Físico, Ergonômico, Psicossocial, Violência. Update `GET /api/b2b/[id]/setores`. |
| Inventário | **Finish** | API exists. UI needs P×S matrix view + CRUD. |
| Plano de Ação | **Minor** | Add link to inventory item; otherwise fine. |
| Incidentes | **Confirm** | Existing `B2BEventsTab` may already serve this. Rename to "Incidentes" if so; else thin CRUD. |
| Compliance | **Minor** | Recompute checklist items against new data. |
| Relatórios | **Build** | The 6 PGR cards + Análise IA 4-view panel. This is the headline tab. |
| Insights | **Repurpose** | Currently `B2BPercepcaoTab` is wired to old Canal de Percepção. Repurpose as the Insights module surface, only visible when flag = true. The Acidentes harassment aggregate moves into Visão Geral or a small banner. |
| Guia | **New** | Static Next.js page. Copy HTML content from Bernardo's `guia.html`, render with our shell. |
| Configurações | **Minor** | Add `bright_insights_enabled` toggle. NR-1 inventory editable fields (CNAE, CIPA, PGR validity dates, etc.) are nice-to-have for the PGR doc but not blocking. |

### Tabs that stay untouched

- Tab routing in `B2BDashboardComponent`
- Filter bar / KPI row primitives
- Auth flows
- Settings tab structure

---

## 9.5 API Namespace Rename — `b2b` → `brightmonitor`

The current `/api/b2b/*` slug is a billing/internal concept that leaks into URLs the client can see (browser network tab, future API consumers). The product is called **BrightMonitor**. We rename.

### Final API surface

| New route | Old route | Purpose |
|---|---|---|
| `/api/brightmonitor/signup` | `/api/b2b/signup` | Company self-service signup |
| `/api/brightmonitor/me` | `/api/b2b/me` | Current company-user context |
| `/api/brightmonitor/profile` | `/api/b2b/profile` | Profile read/write |
| `/api/brightmonitor/[id]/overview` | `/api/b2b/[id]/overview` | Dashboard KPIs |
| `/api/brightmonitor/[id]/setores` | `/api/b2b/[id]/setores` (new alias of part of `risk-map`) | Per-department breakdown |
| `/api/brightmonitor/[id]/inventory` | `/api/b2b/[id]/nr1-inventory` | Risk inventory CRUD |
| `/api/brightmonitor/[id]/action-plans` | same | Action plan CRUD |
| `/api/brightmonitor/[id]/incidents` | `/api/b2b/[id]/events` | Renamed: events → incidents |
| `/api/brightmonitor/[id]/compliance` | same | Compliance status |
| `/api/brightmonitor/[id]/alerts` | same | Auto-alerts |
| `/api/brightmonitor/[id]/settings` | same | Company settings + Insights flag |
| `/api/brightmonitor/[id]/departments` | same | Department list |
| `/api/brightmonitor/[id]/employee-tracking` | same | Who completed assessment |
| `/api/brightmonitor/[id]/reports/pgr/[slug]` | NEW | 6 PGR doc generator |
| `/api/brightmonitor/[id]/reports/analise-ia/[slug]` | NEW | 4-view AI analysis |
| `/api/brightmonitor/[id]/extract-pdf/...` | `/api/b2b/[id]/extract-pdf/...` | PDF extraction (existing, untouched logic) |
| `/api/brightmonitor/[id]/insights/overview` | NEW | Insights module dashboard data |
| `/api/brightmonitor/[id]/insights/scales` | NEW | Per-scale aggregates (PHQ-9, GAD-7, etc.) |

**Naming conventions:**
- `brightmonitor` is the base product → top-level namespace.
- `insights` is a module of BrightMonitor → sub-namespace at `/brightmonitor/[id]/insights/*`. We don't make a top-level `/api/brightinsights/`; it's not a separate product, it's a paid feature flag.
- `reports/pgr/[slug]` and `reports/analise-ia/[slug]` are sub-resources because they share context-building logic.
- Drop `nr1-` prefixes inside the namespace — the namespace already implies NR-1 context (`/inventory` not `/nr1-inventory`).
- Rename `events` → `incidents` (the call's terminology, the law's terminology, and Bernardo's terminology — three signals beat one).

### Migration approach

**Cutover, not parallel.** Maintaining old + new routes doubles maintenance and tempts cargo-culting. We rename in one phase (Phase 0, runs first), update all 46 consuming files, ship.

What changes:
- 22 route files moved from `frontend/app/api/b2b/` to `frontend/app/api/brightmonitor/`
- ~24 hook files in `frontend/features/b2b-dashboard/hooks/` updated to fetch new paths
- A handful of components (`B2BSignupComponent`, `B2BLoginComponent`, `B2BPdfUploadComponent`, `B2BNR1FieldsComponent`) updated
- `frontend/auth/services_and_hooks/useB2BCompanyUser.ts` updated
- `frontend/agents/b2b-laudo/services/b2b-laudo.nodes.ts` updated
- `frontend/app/[locale]/empresa/auth-callback/page.tsx` updated

**What we are NOT renaming in this phase** (deferred to a follow-up cleanup):
- The `frontend/features/b2b-dashboard/` folder name and component prefixes (`B2BDashboardComponent`, `useB2BOverview`, etc.). Renaming the feature folder is a much bigger ripple. We rename the **API surface** (what's externally visible) now; the **internal feature folder name** is a code-org cleanup that can wait. We'll add a `// TODO: rename folder to bright-monitor-dashboard` marker.
- Database table names (`b2b_action_plans` if it exists, etc.). Tables are even more painful to rename safely. The old name is fine — it's not user-visible.

**Cost:** ~1 hour of mechanical refactor + verification (Phase 0). Captures it in one place rather than pollutes other phases.

---

## 10. Files & Directory Structure

```
frontend/
├── features/
│   ├── assessment/
│   │   ├── components/
│   │   │   ├── constants/
│   │   │   │   ├── steps.ts                          # MODIFY — replace B2B_STEPS
│   │   │   │   ├── nr1-options.ts                    # NEW — chemical/biological agent lists, work_time options
│   │   │   │   └── scales/                           # untouched (clinical, used for Insights)
│   │   │   ├── steps/
│   │   │   │   ├── nr1/                              # NEW directory
│   │   │   │   │   ├── PerfilStep.tsx
│   │   │   │   │   ├── FisicoStep.tsx
│   │   │   │   │   ├── QuimicoStep.tsx
│   │   │   │   │   ├── BiologicoStep.tsx
│   │   │   │   │   ├── ErgonomicoStep.tsx
│   │   │   │   │   ├── PsicossocialStep.tsx
│   │   │   │   │   ├── AcidentesStep.tsx
│   │   │   │   │   └── PercepcaoStep.tsx
│   │   │   │   ├── B2BConsentsStep.tsx               # MODIFY — rewrite copy, single LGPD checkbox
│   │   │   │   └── (existing steps untouched)
│   │   │   ├── assessment.interface.ts               # MODIFY — add NR-1 fields
│   │   │   └── AssessmentPage.tsx                    # MODIFY — branch on bright_insights_enabled
│   │   └── helpers/
│   │       └── compute-scores.ts                     # MODIFY — add NR-1 score functions
│   └── b2b-dashboard/
│       └── components/
│           └── tabs/
│               ├── B2BOverviewTab.tsx                # MODIFY — new KPIs + radar + bars
│               ├── B2BSetoresTab.tsx                 # MODIFY — domain columns
│               ├── B2BInventarioTab.tsx              # MODIFY/NEW — finish UI
│               ├── B2BReportsTab.tsx                 # MODIFY — 6 PGR cards + Análise IA
│               ├── B2BPercepcaoTab.tsx               # MODIFY — repurpose for Insights surface
│               └── B2BSettingsTab.tsx                # MODIFY — Insights toggle
├── app/
│   ├── api/
│   │   ├── assessment/
│   │   │   └── submit/route.ts                       # MODIFY — handle NR-1 payload + harassment_reports + incidents
│   │   └── brightmonitor/                            # RENAMED from b2b/ (Phase 0)
│   │       ├── signup/route.ts                       # MOVED
│   │       ├── me/route.ts                           # MOVED
│   │       ├── profile/route.ts                      # MOVED
│   │       └── [companyId]/
│   │           ├── overview/route.ts                 # MOVED + MODIFY — query NR-1 columns
│   │           ├── setores/route.ts                  # MOVED + MODIFY — domain breakdown per dept
│   │           ├── inventory/route.ts                # RENAMED from nr1-inventory/
│   │           ├── action-plans/                     # MOVED
│   │           ├── incidents/                        # RENAMED from events/
│   │           ├── compliance/route.ts               # MOVED
│   │           ├── alerts/route.ts                   # MOVED
│   │           ├── settings/route.ts                 # MOVED + MODIFY — Insights flag
│   │           ├── departments/route.ts              # MOVED
│   │           ├── employee-tracking/route.ts        # MOVED
│   │           ├── extract-pdf/                      # MOVED (no logic change)
│   │           ├── insights/                         # NEW sub-namespace
│   │           │   ├── overview/route.ts
│   │           │   └── scales/route.ts
│   │           └── reports/
│   │               ├── pgr/[slug]/route.ts           # NEW — 6 doc generator
│   │               ├── analise-ia/[slug]/route.ts    # NEW — 4-view AI panel
│   │               └── lib/
│   │                   ├── pgr-prompts.ts            # NEW — 6 prompt templates
│   │                   ├── analise-prompts.ts        # NEW — 4 prompt templates
│   │                   └── build-context.ts          # NEW — context aggregator
│   └── [locale]/
│       └── brightmonitor/
│           └── guia/page.tsx                         # NEW — static methodology page
└── AI_CONTEXT/
    └── PRDS/
        └── _STRATEGY/
            └── [product]_brightmonitor_nr1_realign/
                └── [product]_brightmonitor_nr1_realign_strategy.md   # this file
```

---

## 11. Implementation Phases (high-level)

Phases will be detailed by `/architect`. Tentative:

- **Phase 0 — API namespace rename.** Move `frontend/app/api/b2b/*` → `frontend/app/api/brightmonitor/*`, rename `events` → `incidents`, `nr1-inventory` → `inventory`. Update all 46 consuming files. Smoke-test current dashboard still works against renamed routes. (Wave 0, before everything else.)
- **Phase 1 — DB realignment.** Verify what shipped vs the archived PHASE_1 doc, add missing columns/tables, add `bright_insights_enabled`, create `harassment_reports`. (Wave 0, parallel to Phase 0)
- **Phase 2 — NR-1 form.** 8 new step components, score helpers, payload mapping. (Wave 1, parallel to Phases 0+1)
- **Phase 3 — Submit + write paths.** Update `/api/assessment/submit` to write NR-1 columns + incidents + harassment rows. (Wave 2, after 1+2)
- **Phase 4 — Dashboard data adaptation.** Update `overview`, `setores`, alerts aggregations. Repurpose tabs. (Wave 2, parallel to 3)
- **Phase 5 — PGR generator.** 6 doc types, prompts, endpoint, PDF integration via existing `pdf-helpers.ts`. **Largest single phase.** (Wave 3)
- **Phase 6 — Análise IA panel.** 4 views (Geral / Psicossocial / Críticos / Priorizar), frontend integration in Relatórios tab. (Wave 3, parallel to 5)
- **Phase 7 — Insights flag + Guia page + polish.** Feature flag wiring across surfaces, static Guia page, settings toggle, smoke test. (Wave 4)

QA is implicit (frontend-qa + backend-qa per phase via CTO orchestration).

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **PGR prompt iteration eats hours.** Getting Claude to output legally coherent NR-1 sections with real data takes 3–5 test runs per doc type. | Budget Phase 5 generously. Start with `pgr_completo` (highest value), iterate, then templates for the others reuse the same structure. Pre-write fixture context payloads so prompts can be tested without form submissions. |
| **Existing dashboard APIs assume clinical scale shape.** Adapter work could surprise us. | Phase 4 starts with reading the actual API code and writing a column-by-column migration plan before touching anything. |
| **Schema drift between archived `PHASE_1` doc and live Supabase.** What actually ran vs what was planned is unknown. | Phase 1 starts with `\d risk_assessments` against live, generate a diff, then write the migration. |
| **Client adds requirements mid-build** (per past pattern). | Strategy is named `_realign`. Anything not in section 3 capabilities is rejected for this scope; lands in a follow-up. |
| **PDF visual fidelity demand from client** (e.g. "I want it exactly like Bernardo's"). | Section 7 already states we keep our jspdf template + KMR fonts. Confirm with client at start of Phase 5 — content match, not pixel match. |

---

## 13. Decisions Locked + Remaining Open Questions

### Locked

| # | Decision | Source |
|---|---|---|
| D1 | **PGR PDF keeps our existing jspdf template + KMR fonts + branded header/footer.** Client may revisit layout later; we don't preempt. | Apr 27 follow-up |
| D2 | **Análise IA 4-view panel is in v1 scope** (Geral / Psicossocial / Críticos / Priorizar). It's in Bernardo's reference design, so we ship it. | Apr 27 follow-up |
| D3 | **API namespace renames `b2b` → `brightmonitor`** in this PRD. Insights is a sub-namespace. Feature folder + DB tables stay as-is for now. | Apr 27 follow-up |
| D4 | **Auth stays domain-based.** No CNPJ + employee_code migration. | Apr 15 call |
| D5 | **Bright Insights is a feature flag**, not a separate app. Single dashboard, single form, conditional sections. | Apr 15 call |
| D6 | **Grupo econômico is out of scope.** | Apr 15 call |

### Still open (to confirm before /architect or during Phase 1)

1. **Bright Insights scales for v1.** Which clinical scales come back from the existing code into the Insights module? Conservative bet: PHQ-9, GAD-7, ISI, MBI. Drop SRQ-20 and AEP entirely (Bernardo doesn't use them; client called the SRQ-20-anchored version a mistake). **Recommendation: PHQ-9 + GAD-7 + ISI + MBI for v1.**
2. **`events` table renaming.** Confirm safe to rename to `incidents`, or keep table name `events` and alias only at API + UI layer. **Recommendation: API/UI uses "incidents"; if the table is already named `events`, leave it (table renames are riskier than worth).**
3. **Guia page — copy HTML wholesale or rewrite?** Bernardo's content is dense. Wholesale copy is fastest; rewrite improves quality. **Recommendation: wholesale for pilot, rewrite for GA.**
4. **NR-1 inventory editable fields in Configurações** (CNAE, CIPA, PGR validity dates). These feed the PGR prompts. Strictly required, or can prompts work without them for v1? **Recommendation: prompts handle missing fields gracefully; surface a warning in Configurações for the admin to fill.**
5. **B2B employee report.** The archived PRD specified a "preliminary employee report" (a B2C lead-gen artifact). Still in scope, or deferred? **Recommendation: defer. Not on call's critical path.**
6. **Feature folder rename** (`features/b2b-dashboard/` → `features/brightmonitor-dashboard/`). Deferred per §9.5, but needs a follow-up ticket.

---

## 14. Estimate (advisory; final estimate goes in PRD)

Following the migration findings doc, with corrections for the false-positive react-pdf claim and adapter work:

| Block | Hours |
|---|---|
| Phase 0 — API namespace rename (mechanical) | 1.0 |
| Phase 1 — DB diff + migration | 1.0 |
| Phase 2 — NR-1 form (8 step components + scoring + interface) | 2.0 |
| Phase 3 — Submit endpoint + harassment + incidents writes | 0.5 |
| Phase 4 — Dashboard data adaptation (overview, setores, repurpose tabs) | 2.0 |
| Phase 5 — PGR (6 docs, prompts, jspdf integration) | 3.0 |
| Phase 6 — Análise IA panel (locked in scope) | 1.0 |
| Phase 7 — Insights flag + Guia + Settings + QA | 1.5 |
| **Total** | **~12 h** |

If client later asks for new PDF layout: **+2-3 h** (deferred until they ask).

---

**Strategy ends here.** When this is approved, run `/architect [product]_brightmonitor_nr1_realign` to create the PRD and phase docs.
