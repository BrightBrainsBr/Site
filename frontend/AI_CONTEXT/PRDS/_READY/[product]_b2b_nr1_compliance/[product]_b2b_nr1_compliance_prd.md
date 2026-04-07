# BrightMonitor NR-1 Dashboard — PRD

**Version:** 1.0
**Date:** 1 April 2026
**Status:** Implementation Ready

---

## 1. Overview

BrightMonitor NR-1 replaces the existing B2B dashboard (`features/b2b-dashboard/`) with a fully functional NR-1 compliance dashboard where **every data point is computed from real database fields — nothing is hardcoded**. The current dashboard was built as a V1 proof-of-concept: some tabs show real aggregated data from `mental_health_evaluations`, but the Compliance tab is 90% fake, the Risk Map has hardcoded hierarchy data, and the Reports tab is 100% non-functional.

This PRD covers: (1) a dedicated B2B assessment form with SRQ-20, AEP, Canal de Percepção, and LGPD consents; (2) an AI-generated Laudo Individual PDF for each employee; (3) a 7-tab dashboard wired entirely to real data; (4) CRUD modules for action plans and events; (5) an NR-1 risk inventory PDF generator; (6) a PDF upload + AI extraction pipeline for company data; and (7) employee completion tracking with onboarding flow.

Reference: `[product]_b2b_nr1_compliance_strategy.md` for full problem statement and vision.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          BRIGHTMONITOR NR-1 — SYSTEM MAP                      │
├───────────────────────────┬──────────────────────┬───────────────────────────┤
│                           │                      │                           │
│  COMPANY DASHBOARD        │  B2B ASSESSMENT      │  BRIGHT BRAINS PORTAL     │
│  /empresa/dashboard       │  /avaliacao?c=CODE   │  /portal/empresas/[id]    │
│                           │                      │                           │
│  ┌─────────────────────┐  │  ┌──────────────────┐│  ┌───────────────────────┐│
│  │ 7 Tabs:             │  │  │ NEW B2B Form:    ││  │ B2BDashboardComponent ││
│  │ ├ Visão Geral       │  │  │  SRQ-20 (20 q)   ││  │   isPortalMode=true   ││
│  │ ├ Setores           │  │  │  AEP (14+1 q)    ││  │                       ││
│  │ ├ GRO Psicossocial  │  │  │  Canal Percepção ││  │ + Company management  ││
│  │ ├ Plano de Ação     │  │  │  3× LGPD consent ││  │ + Employee tracking   ││
│  │ ├ Eventos & Nexo    │  │  │                  ││  │ + NR-1 fields         ││
│  │ ├ Compliance NR-1   │  │  │ After submit:    ││  └───────────────────────┘│
│  │ └ Relatórios        │  │  │  AI → Laudo PDF  ││                           │
│  └─────────────────────┘  │  │  4 pages, CRM    ││                           │
│                           │  └──────────────────┘│                           │
│  Settings tab: existing   │                      │                           │
│  CompanySettingsComponent │                      │                           │
│  + NR-1 fields editor     │                      │                           │
│  + PDF upload + AI extract│                      │                           │
└───────────────────────────┴──────────────────────┴───────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS API ROUTES                                  │
│                                                                              │
│  EXISTING (modify):                                                          │
│  /api/b2b/[companyId]/overview      — add SRQ-20/AEP aggregation            │
│  /api/b2b/[companyId]/departments   — add per-instrument per-dept averages  │
│  /api/b2b/[companyId]/domains       — add SRQ-20 and AEP to domain list    │
│  /api/b2b/[companyId]/compliance    — REWRITE: compute from system data     │
│  /api/b2b/[companyId]/alerts        — extend with SRQ-20/AEP thresholds    │
│  /api/assessment/submit             — branch B2B → Laudo pipeline           │
│  /api/assessment/continue-report    — add phase: 'b2b-laudo'               │
│                                                                              │
│  NEW:                                                                        │
│  /api/b2b/[companyId]/gro                — GRO Psicossocial aggregation    │
│  /api/b2b/[companyId]/action-plans       — CRUD for PDCA items             │
│  /api/b2b/[companyId]/events             — CRUD for incidents              │
│  /api/b2b/[companyId]/percepcao          — aggregated form responses       │
│  /api/b2b/[companyId]/employee-tracking  — completion status               │
│  /api/b2b/[companyId]/nr1-inventory      — generate 9-field PDF           │
│  /api/b2b/[companyId]/extract-pdf        — AI-powered PDF data extraction │
│  /api/b2b/[companyId]/reports            — filtered reports (PDF/CSV)      │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 SUPABASE                                      │
│                                                                              │
│  EXISTING TABLES (extend):                                                   │
│  mental_health_evaluations  — scores jsonb gains srq20, aep_* keys          │
│                             — new columns: report_type, laudo_pdf_url,      │
│                               b2c_consent, b2c_consent_at,                  │
│                               b2c_contact_consent, b2c_contact_consent_at   │
│  companies                  — new columns: nr1_process_descriptions,        │
│                               nr1_activities, nr1_preventive_measures,      │
│                               sst_responsible_name, sst_responsible_role,   │
│                               sst_signature_url, emergency_sop_urls,       │
│                               cnae, risk_grade                              │
│                                                                              │
│  NEW TABLES:                                                                 │
│  b2b_action_plans          — PDCA items per company/cycle                   │
│  b2b_events                — incidents, CID codes, days lost                │
│  b2b_percepcao_reports     — aggregated form open-ended responses           │
│                                                                              │
│  STORAGE:                                                                    │
│  assessment-pdfs           — also stores Laudo Individual PDFs              │
│  nr1-inventories           — NR-1 inventory PDFs (NEW bucket)               │
│  company-documents         — uploaded company PDFs (NEW bucket)             │
│  company-signatures        — SST signature images (NEW bucket)              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Principles & Architecture Decisions

1. **Zero hardcoded data.** Every number, status, label, and chart value in the dashboard must be computed from database rows or derived from scores stored in `mental_health_evaluations.scores`. The existing `CHECKLIST_ITEMS`, `TIMELINE_ITEMS`, `LEGAL_DOCS`, `HIERARCHY_DATA`, and `RISK_FACTORS` static arrays are deleted.

2. **Separate B2B form, same infrastructure.** The B2B assessment uses the same `AssessmentPage.tsx` orchestrator but with a completely different step set when `companyContext` is present. B2B steps: SRQ-20 → AEP → Canal de Percepção → LGPD Consents → Summary. The existing 16 clinical scales (PHQ-9, GAD-7, etc.) are NOT shown in B2B mode unless the company enables the BrightPrecision add-on (future scope).

3. **Laudo Individual is AI-generated, not a static template.** Each employee's 4-page Laudo is generated by a single Claude API call that receives the computed scores and produces personalized interpretive text. The PDF template is structured (fixed sections, tables, headers) but the narrative content varies per employee. This follows the same pattern as the B2C clinical report but with a different prompt and lighter output.

4. **TanStack Query for all new data fetching.** All new dashboard hooks use `useQuery` / `useMutation` from TanStack Query. The existing hooks (`useB2BOverview`, `useB2BDepartments`, etc.) already follow this pattern and are extended in place.

5. **Reusable filter component.** A single `B2BFilterBarComponent` handles department, risk level, date range, and instrument-type filtering. It's used across all dashboard tabs and the reports page. Filter state lives in URL params via `nuqs`.

6. **API routes are the backend.** All business logic, Supabase queries, and AI calls happen in Next.js API routes (`app/api/`). Client components never touch Supabase directly.

7. **Portal admin gets the same dashboard.** The existing `isPortalMode` prop on `B2BDashboardComponent` continues to work. Portal admin sees the same 7 tabs + settings, with admin-only capabilities (create action plans for the company, edit NR-1 fields).

8. **PDF upload + AI extraction for company data.** When companies need to provide process descriptions, activity descriptions, or bulk event imports, they upload PDFs. An AI pipeline (Claude) extracts structured data and presents it for admin review before saving.

9. **LangGraph agents for all AI pipelines.** Every AI pipeline in this PRD uses `@langchain/langgraph` StateGraph — NOT raw Anthropic SDK calls with ad-hoc prompt files. This gives us: (a) structured state management across nodes, (b) LangSmith tracing for every run out of the box, (c) conditional error handling and retry policies per node, (d) a consistent folder structure under `agents/` that separates state, graph, nodes, and prompts. The existing B2C report pipeline stays as-is; only NEW pipelines in this PRD use LangGraph. Vercel's 300s `maxDuration` is sufficient for all B2B agents (single-call pipelines, not multi-stage like B2C).

---

## 4. Directory Structure

### New Files

```
frontend/
├── agents/                                          # NEW: LangGraph agent modules
│   ├── shared/
│   │   ├── errors.ts                                # AgentError, RetryableError, retry policies
│   │   └── tracing.ts                               # ensureTracingFlushed() for Vercel
│   │
│   ├── b2b-laudo/                                   # Laudo Individual generation agent
│   │   ├── models/
│   │   │   ├── b2b-laudo.interface.ts               # CompanyLaudoData, PreviousEvaluationSummary, LaudoSections
│   │   │   └── b2b-laudo.state.ts                   # StateSchema (Zod) — eval, scores, company, markdown, pdf
│   │   ├── prompts/
│   │   │   └── b2b-laudo.prompts.ts                 # B2B_LAUDO_SYSTEM + buildLaudoUserMessage()
│   │   └── services/
│   │       ├── b2b-laudo.graph.ts                   # StateGraph definition → compiled graph export
│   │       ├── b2b-laudo.nodes.ts                   # loadContext, generateText, buildPdf, storeResult
│   │       └── b2b-laudo.storage.ts                 # fetchEvaluation, fetchCompany, fetchHistory, uploadPdf, updateEval
│   │
│   ├── pdf-extraction/                              # PDF upload → AI → structured data agent
│   │   ├── models/
│   │   │   ├── pdf-extraction.interface.ts          # NR1FieldsOutput, EventsBulkOutput, ExtractionResult
│   │   │   └── pdf-extraction.state.ts              # StateSchema — fileUrl, extractionType, rawText, extracted
│   │   ├── prompts/
│   │   │   └── pdf-extraction.prompts.ts            # NR1_FIELDS_EXTRACTION + EVENTS_BULK_EXTRACTION system prompts
│   │   └── services/
│   │       ├── pdf-extraction.graph.ts              # StateGraph definition → compiled graph export
│   │       ├── pdf-extraction.nodes.ts              # parsePdf, extractData, validateOutput
│   │       └── pdf-extraction.storage.ts            # downloadPdf (from Supabase bucket)
│   │
│   └── action-plan-generator/                       # GRO → suggested action items agent
│       ├── models/
│       │   ├── action-plan-generator.interface.ts   # GeneratedActionItem, GROContext
│       │   └── action-plan-generator.state.ts       # StateSchema — companyId, groData, generatedItems
│       ├── prompts/
│       │   └── action-plan-generator.prompts.ts     # ACTION_PLAN_SYSTEM prompt + buildGroContextMessage()
│       └── services/
│           ├── action-plan-generator.graph.ts       # StateGraph definition → compiled graph export
│           ├── action-plan-generator.nodes.ts       # loadGroData, generatePlans
│           └── action-plan-generator.storage.ts     # fetchGroAggregation (from mental_health_evaluations)
│
├── features/
│   ├── assessment/
│   │   ├── components/
│   │   │   ├── steps/
│   │   │   │   ├── SRQ20Step.tsx                    # NEW: 20 Yes/No questions, 4 groups
│   │   │   │   ├── AEPStep.tsx                      # NEW: 14 Likert + 1 open question
│   │   │   │   ├── CanalPercepcaoStep.tsx           # NEW: risk perception form
│   │   │   │   └── B2BConsentsStep.tsx              # NEW: 3 LGPD consent checkboxes
│   │   │   └── constants/
│   │   │       └── scales/
│   │   │           ├── srq20.ts                     # NEW: 20 questions, 4 categories
│   │   │           └── aep.ts                       # NEW: 14 questions, 6 dimensions, reverse scoring
│   │   └── helpers/
│   │       └── compute-scores.ts                    # MODIFY: add scoreSRQ20(), scoreAEP()
│   │
│   └── b2b-dashboard/
│       ├── b2b-dashboard.interface.ts               # MODIFY: add GRO, action plan, event, percepcao types
│       ├── constants/
│       │   ├── domain-mapping.ts                    # MODIFY: add SRQ-20, AEP display names + max scores
│       │   └── cid-codes.ts                         # NEW: CID-10 code list (loaded from DB later)
│       ├── components/
│       │   ├── B2BDashboardComponent.tsx             # MODIFY: new 7-tab structure
│       │   ├── shared/
│       │   │   ├── B2BFilterBarComponent.tsx         # NEW: reusable filter bar (dept, risk, date, instrument)
│       │   │   ├── B2BEmployeeTrackingComponent.tsx  # NEW: onboarding/completion tracking view
│       │   │   ├── B2BNR1FieldsComponent.tsx         # NEW: editable NR-1 company fields + PDF upload
│       │   │   └── B2BPdfUploadComponent.tsx         # NEW: PDF upload + AI extraction UI
│       │   └── tabs/
│       │       ├── B2BOverviewTab.tsx                # REWRITE: KPI strip, donut, timeline, alerts
│       │       ├── B2BSetoresTab.tsx                 # NEW: replaces B2BRiskMapTab
│       │       ├── B2BGROTab.tsx                     # NEW: radar, AEP dimensions, SRQ-20 dist, matrix
│       │       ├── B2BActionPlanTab.tsx              # NEW: PDCA CRUD + AI generation
│       │       ├── B2BEventsTab.tsx                  # NEW: event diary + PDF upload
│       │       ├── B2BComplianceTab.tsx              # REWRITE: computed NR-1 status
│       │       ├── B2BReportsTab.tsx                 # REWRITE: real PDF generation + filters
│       │       ├── B2BSettingsTab.tsx                # MODIFY: add NR-1 fields section
│       │       ├── B2BAlertsTab.tsx                  # DELETE (absorbed into overview)
│       │       ├── B2BDomainsTab.tsx                 # DELETE (absorbed into GRO)
│       │       └── B2BRiskMapTab.tsx                 # DELETE (replaced by Setores)
│       └── hooks/
│           ├── useB2BOverview.ts                     # MODIFY: updated response shape
│           ├── useB2BDepartments.ts                  # MODIFY: updated response shape
│           ├── useB2BCompliance.ts                   # MODIFY: new computed checklist
│           ├── useB2BAlerts.ts                       # UNCHANGED
│           ├── useB2BDomains.ts                      # MODIFY: add SRQ-20, AEP
│           ├── useB2BGROQueryHook.ts                 # NEW
│           ├── useB2BActionPlansQueryHook.ts         # NEW: list query
│           ├── useB2BActionPlansMutationHook.ts      # NEW: create/update/delete
│           ├── useB2BEventsQueryHook.ts              # NEW: list query
│           ├── useB2BEventsMutationHook.ts           # NEW: create/update/delete + PDF upload
│           ├── useB2BPercepcaoQueryHook.ts           # NEW
│           ├── useB2BEmployeeTrackingQueryHook.ts    # NEW
│           ├── useB2BNR1InventoryMutationHook.ts     # NEW
│           ├── useB2BReportsMutationHook.ts          # NEW: generate filtered reports
│           └── useB2BExtractPdfMutationHook.ts       # NEW: PDF upload + AI extract
│
├── app/
│   └── api/
│       ├── assessment/
│       │   ├── submit/route.ts                      # MODIFY: B2B → invoke b2b-laudo agent
│       │   └── continue-report/route.ts             # MODIFY: add phase 'b2b-laudo' → agent
│       │
│       └── b2b/
│           ├── lib/
│           │   └── riskUtils.ts                     # MODIFY: add srq20, aep_* to SCALE_MAX
│           └── [companyId]/
│               ├── overview/route.ts                # MODIFY: SRQ-20/AEP in response
│               ├── departments/route.ts             # MODIFY: per-instrument averages
│               ├── domains/route.ts                 # MODIFY: add SRQ-20, AEP
│               ├── compliance/route.ts              # REWRITE: compute real 17-item checklist
│               ├── alerts/route.ts                  # MODIFY: SRQ-20/AEP thresholds
│               ├── gro/route.ts                     # NEW
│               ├── action-plans/
│               │   ├── route.ts                     # NEW: GET + POST
│               │   └── [planId]/route.ts            # NEW: PATCH + DELETE
│               ├── events/
│               │   ├── route.ts                     # NEW: GET + POST
│               │   └── [eventId]/route.ts           # NEW: PATCH + DELETE
│               ├── percepcao/route.ts               # NEW: GET aggregated
│               ├── employee-tracking/route.ts       # NEW: GET
│               ├── nr1-inventory/route.ts           # NEW: POST generate + GET download
│               ├── extract-pdf/route.ts             # NEW: POST PDF → AI → structured data
│               └── reports/route.ts                 # NEW: POST generate filtered report
```

### Files to Delete

```
features/b2b-dashboard/components/tabs/B2BAlertsTab.tsx     # Absorbed into B2BOverviewTab
features/b2b-dashboard/components/tabs/B2BDomainsTab.tsx    # Absorbed into B2BGROTab
features/b2b-dashboard/components/tabs/B2BRiskMapTab.tsx    # Replaced by B2BSetoresTab
```

---

## 5. Service & Agent Specifications

### 5.1 B2B Assessment Form — New Steps

**File:** `features/assessment/components/steps/SRQ20Step.tsx`
**Purpose:** 20 binary (Sim/Não) questions from WHO SRQ-20 instrument, organized in 4 groups.

- Uses `GenericScaleStep` pattern with binary options instead of Likert
- Question data from `constants/scales/srq20.ts`
- CVV alert triggered when question 12 (suicidal ideation) is answered "Sim"
- Stores answers as `srq20_answers: number[]` in `formData`

**File:** `features/assessment/components/steps/AEPStep.tsx`
**Purpose:** 14 Likert (0–4) questions + 1 open-ended across 6 dimensions.

- Uses `LikertQuestion` component (Nunca → Sempre)
- 10 of 14 items have reverse scoring (higher answer = lower risk)
- Open-ended Q15 stored as `aep_percepcao_livre: string`
- Question data from `constants/scales/aep.ts`
- Shows per-dimension result after completion

**File:** `features/assessment/components/steps/CanalPercepcaoStep.tsx`
**Purpose:** Anonymous risk perception report integrated into the B2B form flow.

- Fields: urgência (urgente/registro), tipo (9 categories), frequência, setor, impacto, descrição, sugestão
- Data stored as `canal_percepcao: object` in `formData`
- On assessment submit, this data is inserted into `b2b_percepcao_reports`

**File:** `features/assessment/components/steps/B2BConsentsStep.tsx`
**Purpose:** 3 LGPD consent checkboxes required for B2B employees.

- ① Anonymized data for company consolidated indicators
- ② Data saved for potential future doctor-patient relationship at Bright Brains
- ③ Contact data for Bright Brains communications
- Stores as `b2b_consent_anonymized`, `b2c_consent`, `b2c_contact_consent` booleans

**File:** `features/assessment/components/constants/scales/srq20.ts`
**Key exports:** `SRQ20_QUESTIONS` (20 items in 4 groups), `SRQ20_RANGES` (cutoff ≥8)

**File:** `features/assessment/components/constants/scales/aep.ts`
**Key exports:** `AEP_QUESTIONS` (14 items, 6 dimensions), `AEP_REVERSE_INDICES`, `AEP_RANGES` (0-56 scale), `AEP_CATEGORY_DEFINITIONS`

### 5.2 Scoring Extensions

**File:** `features/assessment/helpers/compute-scores.ts`
**Add methods:**
- `scoreSRQ20(answers: number[]): number` — sum of "Sim" answers (0 or 1)
- `scoreAEP(answers: number[]): { total: number, pressure: number, autonomy: number, breaks: number, relationships: number, cognitive: number, environment: number }` — applies reverse scoring then sums per dimension

**File:** `app/api/b2b/lib/riskUtils.ts`
**Add to `SCALE_MAX`:** `srq20: 20`, `aep_total: 56`, `aep_pressure: 12`, `aep_autonomy: 8`, `aep_breaks: 8`, `aep_relationships: 12`, `aep_cognitive: 8`, `aep_environment: 8`
**Add to `DOMAIN_KEYS`:** `'srq20'`, `'aep_total'`

### 5.3 LangGraph Agent Infrastructure

All AI pipelines in this PRD use `@langchain/langgraph` StateGraph. Agent-specific infra lives in `agents/shared/`, but **all LLM calls go through the existing `shared/utils/llm` service** — NOT raw provider SDKs.

**Existing:** `shared/utils/llm/services/llmService.ts` — the `LLMService` class and `llmService` singleton
- Multi-provider (Anthropic, OpenAI, Google, Groq, Grok, Perplexity) with automatic fallback
- Structured output with Zod validation + automatic JSON fix pipeline
- Rate limit retry with exponential backoff
- Already uses LangChain under the hood (`ChatAnthropic`, `ChatOpenAI`, etc.)
- `getAnthropicConfigForTask()` for task-based config optimization (thinking, caching, token limits)
- `llmService.getLlmInstance(config)` returns a LangChain `BaseChatModel` for raw invocation
- `llmService.invokeStructuredOutput({ promptMessages, outputSchema, primaryConfigDict, fallbackConfigDict?, fixerConfigDict? })` for structured JSON responses with Zod validation

**How agents use it:**
- For **structured output** (PDF extraction, action plan generation): use `llmService.invokeStructuredOutput()` with Zod schema — gets validation, retry, fallback, and JSON fixing for free
- For **free-form text** (Laudo markdown): use `llmService.getLlmInstance(config)` to get a LangChain model, then `await model.invoke(messages)` — still gets LangSmith tracing since it's a LangChain model
- Config dicts use `getAnthropicConfigForTask()` — extend the task config helper with B2B task types: `b2b_laudo_generation` (COMPLEX — enable thinking), `pdf_extraction` (MODERATE), `action_plan_generation` (MODERATE)

**File:** `agents/shared/errors.ts`
**Key exports:** `AgentError` class, `RetryableError` subclass, default `retryPolicy` config (3 attempts, exponential backoff, skip TypeError/SyntaxError)

**File:** `agents/shared/tracing.ts`
**Key export:** `ensureTracingFlushed()` — must be called at the end of every API route handler that invokes an agent. Serverless (Vercel) requires `LANGCHAIN_CALLBACKS_BACKGROUND=false` so traces flush before the function exits. This helper enforces that.

### 5.4 Agent: B2B Laudo Individual (`agents/b2b-laudo/`)

Generates the 4-page Laudo Individual PDF for each B2B employee after assessment submission.

**`models/b2b-laudo.interface.ts`** — TypeScript types for the agent:
- `CompanyLaudoData`: `{ name, cnpj, cnae, risk_grade, sst_responsible_name?, sst_signature_url? }`
- `PreviousEvaluationSummary`: `{ cycle_label, created_at, scores, risk_level }`
- `LaudoSections`: parsed AI output with section 4-8 content
- `LaudoGenerationInput`: `{ evaluationId: string }` — what the API route passes in
- `LaudoGenerationOutput`: `{ pdfUrl: string, laudoMarkdown: string }` — what the graph returns

**`models/b2b-laudo.state.ts`** — LangGraph StateSchema (Zod):
```typescript
const B2BLaudoState = new StateSchema({
  evaluationId: z.string(),
  formData: z.record(z.any()).default({}),
  scores: z.record(z.number()).default({}),
  companyData: CompanyLaudoDataSchema.default({ name: '', cnpj: '', cnae: '', risk_grade: '' }),
  historyData: z.array(PreviousEvaluationSummarySchema).default([]),
  laudoMarkdown: z.string().default(''),
  pdfBuffer: z.any().optional(),
  pdfUrl: z.string().default(''),
  status: z.enum(['init', 'context_loaded', 'text_generated', 'pdf_built', 'stored', 'error']).default('init'),
  errors: z.array(z.string()).default([]),
})
```

**`prompts/b2b-laudo.prompts.ts`** — Prompt templates:
- `B2B_LAUDO_SYSTEM`: instructs Claude to generate personalized interpretive paragraphs for sections 4-8 of the Laudo (scale interpretation, AEP analysis, risk narrative, PDCA recommendations, trend analysis). Output is structured markdown with `## SECTION_N` markers. CFM-professional tone. Never CID codes.
- `buildLaudoUserMessage(state)`: templates scores, demographics, company context, history into the user message

**`services/b2b-laudo.graph.ts`** — StateGraph definition:
```
[START] → loadContext → generateText → buildPdf → storeResult → [END]
                │               │            │            │
                └───────────────┴────────────┴────────────┘
                          (on error → END with error state)
```

**`services/b2b-laudo.nodes.ts`** — All node functions in one file:

| Node | What it does |
|------|-------------|
| `loadContext` | Calls `b2bLaudoStorage.fetchEvaluation()`, `.fetchCompany()`, `.fetchHistory()`. Returns `{ formData, scores, companyData, historyData, status: 'context_loaded' }` |
| `generateText` | Uses `llmService.getLlmInstance(getAnthropicConfigForTask('b2b_laudo_generation'))` for free-form markdown. Single Claude call with prompts from `b2b-laudo.prompts.ts`. Returns `{ laudoMarkdown, status: 'text_generated' }` |
| `buildPdf` | jspdf 4-page A4 PDF. Page 1: ID tables. Page 2: scale + AEP tables. Page 3: risk matrix + PDCA. Page 4: history + signatures. Returns `{ pdfBuffer, status: 'pdf_built' }` |
| `storeResult` | Calls `b2bLaudoStorage.uploadPdf()`, `.updateEvaluation()`, sends `b2b_laudo_ready` webhook. Returns `{ pdfUrl, status: 'stored' }` |

**`services/b2b-laudo.storage.ts`** — All Supabase operations isolated:
- `fetchEvaluation(evaluationId)` → evaluation row from `mental_health_evaluations`
- `fetchCompany(companyId)` → company row from `companies`
- `fetchHistory(email, companyId, limit)` → previous evaluations for trend section
- `uploadPdf(evaluationId, pdfBuffer)` → upload to `assessment-pdfs` bucket, return URL
- `updateEvaluation(evaluationId, { laudo_pdf_url, laudo_markdown, status })` → update row

**Invocation:** `await b2bLaudoGraph.invoke({ evaluationId })` from `continue-report/route.ts` when `phase === 'b2b-laudo'`. Every node is auto-traced in LangSmith.

### 5.5 Agent: PDF Extraction (`agents/pdf-extraction/`)

Extracts structured data from uploaded company PDFs (NR-1 fields or bulk events).

**`models/pdf-extraction.interface.ts`** — TypeScript types:
- `NR1FieldsOutput`: `{ process_descriptions: string, activities: string, preventive_measures: string }`
- `EventsBulkOutput`: `{ events: Array<{ event_date, event_type, cid_code?, description, department?, days_lost? }> }`
- `ExtractionResult`: `{ extracted: NR1FieldsOutput | EventsBulkOutput, confidence: number, warnings: string[] }`

**`models/pdf-extraction.state.ts`** — LangGraph StateSchema (Zod):
```typescript
const PdfExtractionState = new StateSchema({
  fileUrl: z.string(),
  extractionType: z.enum(['nr1-fields', 'events-bulk']),
  rawText: z.string().default(''),
  extracted: z.record(z.any()).default({}),
  confidence: z.number().default(0),
  warnings: z.array(z.string()).default([]),
  status: z.enum(['init', 'parsed', 'extracted', 'validated', 'error']).default('init'),
  errors: z.array(z.string()).default([]),
})
```

**`prompts/pdf-extraction.prompts.ts`** — Two system prompts selected by `extractionType`:
- `NR1_FIELDS_EXTRACTION_SYSTEM`: extract process descriptions, activities, preventive measures from company documents
- `EVENTS_BULK_EXTRACTION_SYSTEM`: extract structured event list from HR reports / medical leave records

**`services/pdf-extraction.graph.ts`** — StateGraph:
```
[START] → parsePdf → extractData → validateOutput → [END]
```

**`services/pdf-extraction.nodes.ts`** — All node functions:

| Node | What it does |
|------|-------------|
| `parsePdf` | Calls `pdfExtractionStorage.downloadPdf()`, extracts text with `pdf-parse`. Returns `{ rawText, status: 'parsed' }` |
| `extractData` | Uses `llmService.invokeStructuredOutput()` with type-specific prompt + Zod schema. Gets validation, retry, fallback for free. Returns `{ extracted, status: 'extracted' }` |
| `validateOutput` | Validates extracted JSON, computes confidence (0-1) based on field completeness, flags warnings. Returns `{ extracted, confidence, warnings, status: 'validated' }` |

**`services/pdf-extraction.storage.ts`** — Supabase operations:
- `downloadPdf(fileUrl)` → fetch PDF from Supabase storage, return buffer

**Invocation:** `await pdfExtractionGraph.invoke({ fileUrl, extractionType })` from `extract-pdf/route.ts`.

### 5.6 Agent: Action Plan Generator (`agents/action-plan-generator/`)

Generates 3-5 PDCA action items based on department GRO data.

**`models/action-plan-generator.interface.ts`** — TypeScript types:
- `GROContext`: `{ scaleAverages, aepDimensions, srq20Distribution, riskMatrix, departmentName? }`
- `GeneratedActionItem`: `{ description, priority: 'alta' | 'media' | 'baixa', responsible, deadline_suggestion, notes }`

**`models/action-plan-generator.state.ts`** — LangGraph StateSchema (Zod):
```typescript
const ActionPlanState = new StateSchema({
  companyId: z.string(),
  department: z.string().optional(),
  cycleId: z.string().optional(),
  groData: GROContextSchema.default({}),
  generatedItems: z.array(GeneratedActionItemSchema).default([]),
  status: z.enum(['init', 'context_loaded', 'generated', 'error']).default('init'),
  errors: z.array(z.string()).default([]),
})
```

**`prompts/action-plan-generator.prompts.ts`**:
- `ACTION_PLAN_SYSTEM`: instructs Claude to generate 3-5 PDCA items based on GRO risk data. NR-1 compliant, practical, department-specific.
- `buildGroContextMessage(groData, department?)`: templates the GRO data into the user message

**`services/action-plan-generator.graph.ts`** — StateGraph:
```
[START] → loadGroData → generatePlans → [END]
```

**`services/action-plan-generator.nodes.ts`** — All node functions:

| Node | What it does |
|------|-------------|
| `loadGroData` | Calls `actionPlanStorage.fetchGroAggregation()`. Returns `{ groData, status: 'context_loaded' }` |
| `generatePlans` | Uses `llmService.invokeStructuredOutput()` with GRO context + `GeneratedActionItemSchema` array. Returns `{ generatedItems, status: 'generated' }` |

**`services/action-plan-generator.storage.ts`** — Supabase operations:
- `fetchGroAggregation(companyId, cycleId?, department?)` → query `mental_health_evaluations`, compute scale averages + AEP dimensions + SRQ-20 distribution

**Invocation:** `await actionPlanGraph.invoke({ companyId, department })` from `action-plans/route.ts` when `generate: true`.

### 5.7 Assessment Submission Branching

**File:** `app/api/assessment/submit/route.ts`
**Modification:** After insert into `mental_health_evaluations`:
- If `company_id` is present AND form contains SRQ-20/AEP data → set `report_type = 'b2b-laudo'`
- Insert `canal_percepcao` data into `b2b_percepcao_reports` (if provided)
- Save consent flags: `b2c_consent`, `b2c_consent_at`, `b2c_contact_consent`, `b2c_contact_consent_at`
- In `after()`: POST to `continue-report` with `phase: 'b2b-laudo'` instead of `'stage1'`

**File:** `app/api/assessment/continue-report/route.ts`
**Add handler for `phase === 'b2b-laudo'`:**
1. Import compiled graph from `agents/b2b-laudo/services/b2b-laudo.graph.ts`
2. `await b2bLaudoGraph.invoke({ evaluationId })` — the agent handles everything (DB fetch, Claude call, PDF gen, storage, webhook)
3. Call `ensureTracingFlushed()` before response
4. No more manual orchestration — the graph manages the full pipeline

### 5.8 Dashboard Tab Components

**File:** `features/b2b-dashboard/components/tabs/B2BOverviewTab.tsx`
**Purpose:** Company-wide KPIs, risk distribution, monthly evolution, active alerts.
**Data sources:** `useB2BOverview`, `useB2BAlerts`
**Key sections:**
- 5-column KPI strip: Total Avaliados, Baixo, Moderado, Elevado, Crítico (from `riskDistribution`)
- Donut chart: risk distribution (Chart.js or recharts)
- Stacked bar chart: monthly evolution per cycle
- Alert cards: from `/api/b2b/[id]/alerts` — inline, not a separate tab

**File:** `features/b2b-dashboard/components/tabs/B2BSetoresTab.tsx`
**Purpose:** Per-sector risk table with sortable instrument columns.
**Data source:** `useB2BDepartments` (extended response)
**Key features:**
- Sortable columns: Setor, Colabs, Risco, Score, PHQ-9, GAD-7, SRQ-20, AEP, Ações Pendentes
- Sort buttons above table (like client HTML prototype)
- Color-coded values based on scale thresholds
- Filterable via `B2BFilterBarComponent`

**File:** `features/b2b-dashboard/components/tabs/B2BGROTab.tsx`
**Purpose:** GRO Psicossocial — clinical scales radar, AEP dimensions, SRQ-20 distribution, probability × severity matrix.
**Data source:** `useB2BGROQueryHook`
**Key sections:**
- Radar chart: clinical scale averages (PHQ-9, GAD-7, SRQ-20, PSS-10, MBI-EE, ISI)
- Horizontal bar chart: AEP 6 dimensions (avg scores)
- 4-card SRQ-20 distribution: Negativo (<8), Moderado (8-11), Elevado (12-16), Crítico (17-20)
- 3×4 probability × severity matrix grid with employee counts per cell

**File:** `features/b2b-dashboard/components/tabs/B2BActionPlanTab.tsx`
**Purpose:** PDCA action plan CRUD with AI generation.
**Data source:** `useB2BActionPlansQueryHook`, `useB2BActionPlansMutationHook`
**Key features:**
- 4 status counter cards: Pendente, Em Andamento, Agendado, Concluído
- Action item list with inline edit
- "Gerar com IA" button → calls API that generates suggestions based on GRO data
- Create/edit form: description, sector, priority, status, responsible, deadline, notes
- Filterable via `B2BFilterBarComponent`

**File:** `features/b2b-dashboard/components/tabs/B2BEventsTab.tsx`
**Purpose:** Event diary for incidents, sick leave, CID-10 tracking.
**Data source:** `useB2BEventsQueryHook`, `useB2BEventsMutationHook`
**Key features:**
- 3 KPI cards: Afastamentos (90d), Dias Perdidos, Relatos Canal
- "Novo Evento" button → create form (date, type, CID code, description, sector, days lost)
- "Upload PDF" button → `B2BPdfUploadComponent` for bulk import
- Event list with date, type badge, CID code, description, sector, days
- CID code picker with search (populated from configurable list)
- Filterable via `B2BFilterBarComponent`

**File:** `features/b2b-dashboard/components/tabs/B2BComplianceTab.tsx`
**Purpose:** Computed NR-1 compliance status — no hardcoded items.
**Data source:** `useB2BCompliance` (rewritten API)
**Key features:**
- Score display: X/Y requisitos conformes, progress bar
- 17-item checklist where each status is computed from system data (see Section 9)
- Each item shows: NR-1 reference, description, computed detail, status badge (conforme/parcial/pendente)

**File:** `features/b2b-dashboard/components/tabs/B2BReportsTab.tsx`
**Purpose:** Report generation with filtering and download.
**Data source:** `useB2BReportsMutationHook`
**Key features:**
- `B2BFilterBarComponent` at top — filter by department, risk level, date range
- Report types: GRO Consolidado PDF, Relatório por Departamento, CSV Export
- Each report type has "Gerar" button → server generates → download link
- NR-1 Inventory generation button (separate, uses `useB2BNR1InventoryMutationHook`)

### 5.9 Shared Components

**File:** `features/b2b-dashboard/components/shared/B2BFilterBarComponent.tsx`
**Purpose:** Reusable filter bar for all dashboard tabs and reports.
**Props:** `filters: FilterConfig[]`, `onChange: (filters) => void`
**Implementation:**
- Filter state in URL via `nuqs` (shareable, bookmarkable)
- Available filter types: department (multiselect from company departments), risk level (multiselect: baixo/moderado/elevado/critico), date range (start/end picker), instrument (select: PHQ-9, GAD-7, SRQ-20, AEP)
- Compact pill-based UI, collapsible

**File:** `features/b2b-dashboard/components/shared/B2BEmployeeTrackingComponent.tsx`
**Purpose:** Shows when company has low completion. Replaces empty dashboard with onboarding view.
**Data source:** `useB2BEmployeeTrackingQueryHook`
**Shows:**
- Overall progress bar (X of Y employees completed, Z%)
- Per-department progress bars
- Employee table: email, department, status (Pendente/Iniciou/Completou), action (Reenviar)
- Threshold: when completion < 30%, this view replaces the dashboard tabs

**File:** `features/b2b-dashboard/components/shared/B2BNR1FieldsComponent.tsx`
**Purpose:** Editable company NR-1 fields (used in Settings tab).
**Features:**
- Text areas for: process descriptions, activity descriptions, preventive measures (per department)
- SST responsible name + role text fields
- SST signature upload (image → `company-signatures` bucket)
- PDF upload option: upload company PDF → AI extracts relevant NR-1 content → admin reviews → saves

**File:** `features/b2b-dashboard/components/shared/B2BPdfUploadComponent.tsx`
**Purpose:** Generic PDF upload with AI-powered data extraction.
**Props:** `extractionType: 'nr1-fields' | 'events-bulk'`, `companyId: string`, `onExtracted: (data) => void`
**Flow:**
1. User uploads PDF → stored in `company-documents` bucket
2. POST to `/api/b2b/[companyId]/extract-pdf` with file URL + extraction type
3. API runs Claude with extraction prompt → returns structured data
4. Component shows extracted data for review → user confirms → parent saves

---

## 6. API Endpoints

### New Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/b2b/[companyId]/gro` | B2B user | Scale averages, AEP dimensions, SRQ-20 distribution, risk matrix |
| `GET` | `/api/b2b/[companyId]/action-plans` | B2B user | List PDCA items (filterable by cycle, status, dept) |
| `POST` | `/api/b2b/[companyId]/action-plans` | B2B user | Create item. If `generate: true`, AI generates from GRO data |
| `PATCH` | `/api/b2b/[companyId]/action-plans/[planId]` | B2B user | Update fields/status |
| `DELETE` | `/api/b2b/[companyId]/action-plans/[planId]` | B2B user | Delete item |
| `GET` | `/api/b2b/[companyId]/events` | B2B user | List events + KPI aggregation |
| `POST` | `/api/b2b/[companyId]/events` | B2B user | Create event (single or bulk from extraction) |
| `PATCH` | `/api/b2b/[companyId]/events/[eventId]` | B2B user | Update event |
| `DELETE` | `/api/b2b/[companyId]/events/[eventId]` | B2B user | Delete event |
| `GET` | `/api/b2b/[companyId]/percepcao` | B2B user | Aggregated Canal + AEP Q15 responses |
| `GET` | `/api/b2b/[companyId]/employee-tracking` | B2B user | Per-employee completion status from `company_access_codes` |
| `POST` | `/api/b2b/[companyId]/nr1-inventory` | B2B user | Generate 9-field NR-1 inventory PDF |
| `GET` | `/api/b2b/[companyId]/nr1-inventory` | B2B user | Download latest inventory PDF |
| `POST` | `/api/b2b/[companyId]/extract-pdf` | B2B user | Upload PDF → AI extraction → structured data |
| `POST` | `/api/b2b/[companyId]/reports` | B2B user | Generate filtered report (GRO PDF, dept report, CSV) |

### Modified Routes

| Method | Path | Change |
|--------|------|--------|
| `GET` | `/api/b2b/[companyId]/overview` | Add `srq20Avg`, `aepAvg`, `alertCount`, per-month timeline data |
| `GET` | `/api/b2b/[companyId]/departments` | Add per-instrument averages (phq9, gad7, srq20, aep) per dept + `pendingActions` count |
| `GET` | `/api/b2b/[companyId]/domains` | Add `srq20` and `aep_total` to domain list |
| `GET` | `/api/b2b/[companyId]/compliance` | Full rewrite: return 17-item computed checklist (see Section 9) |
| `GET` | `/api/b2b/[companyId]/alerts` | Add SRQ-20 ≥ 8 and AEP thresholds to alert criteria |
| `POST` | `/api/assessment/submit` | Branch B2B → `report_type = 'b2b-laudo'`, insert percepcao data |
| `POST` | `/api/assessment/continue-report` | Add `phase: 'b2b-laudo'` handler |
| `GET/POST` | `/api/b2b/[companyId]/settings` | Accept NR-1 fields, SST responsible, signature URL on update |

---

## 7. Database Schema

### New Tables

```sql
CREATE TABLE b2b_action_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id        uuid REFERENCES assessment_cycles(id),
  description     text NOT NULL,
  department      text,
  priority        text NOT NULL DEFAULT 'media'
    CHECK (priority IN ('critica', 'alta', 'media', 'baixa')),
  status          text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'agendado')),
  responsible     text,
  deadline        date,
  notes           text,
  ai_generated    boolean NOT NULL DEFAULT false,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_action_plans_company_idx ON b2b_action_plans(company_id);
CREATE INDEX b2b_action_plans_cycle_idx ON b2b_action_plans(cycle_id);
CREATE INDEX b2b_action_plans_status_idx ON b2b_action_plans(status);


CREATE TABLE b2b_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_date      date NOT NULL,
  event_type      text NOT NULL
    CHECK (event_type IN ('afastamento', 'relato_canal', 'acidente', 'outro')),
  cid_code        text,
  description     text NOT NULL,
  department      text,
  days_lost       integer,
  source          text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'pdf_import', 'form')),
  notes           text,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_events_company_idx ON b2b_events(company_id);
CREATE INDEX b2b_events_date_idx ON b2b_events(event_date);
CREATE INDEX b2b_events_type_idx ON b2b_events(event_type);


CREATE TABLE b2b_percepcao_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id        uuid REFERENCES assessment_cycles(id),
  evaluation_id   uuid REFERENCES mental_health_evaluations(id),
  report_type     text NOT NULL
    CHECK (report_type IN ('estresse', 'sobrecarga', 'assedio_moral', 'assedio_sexual',
      'conflito', 'condicoes_fisicas', 'falta_recursos', 'discriminacao', 'outro')),
  urgencia        text NOT NULL DEFAULT 'registro'
    CHECK (urgencia IN ('urgente', 'registro')),
  frequencia      text,
  department      text,
  impacto         text,
  descricao       text NOT NULL,
  sugestao        text,
  source          text NOT NULL DEFAULT 'form'
    CHECK (source IN ('form', 'aep_q15')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_percepcao_company_idx ON b2b_percepcao_reports(company_id);
CREATE INDEX b2b_percepcao_type_idx ON b2b_percepcao_reports(report_type);
CREATE INDEX b2b_percepcao_urgent_idx ON b2b_percepcao_reports(urgencia) WHERE urgencia = 'urgente';
```

### Extend Existing Tables

```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS nr1_process_descriptions  jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nr1_activities            jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nr1_preventive_measures   jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sst_responsible_name      text,
  ADD COLUMN IF NOT EXISTS sst_responsible_role      text,
  ADD COLUMN IF NOT EXISTS sst_signature_url         text,
  ADD COLUMN IF NOT EXISTS emergency_sop_urls        jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cnae                      text,
  ADD COLUMN IF NOT EXISTS risk_grade                text;

ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS report_type               text DEFAULT 'clinical'
    CHECK (report_type IN ('clinical', 'b2b-laudo')),
  ADD COLUMN IF NOT EXISTS laudo_markdown            text,
  ADD COLUMN IF NOT EXISTS laudo_pdf_url             text,
  ADD COLUMN IF NOT EXISTS b2c_consent               boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2c_consent_at            timestamptz,
  ADD COLUMN IF NOT EXISTS b2c_contact_consent       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2c_contact_consent_at    timestamptz,
  ADD COLUMN IF NOT EXISTS b2b_anonymized_consent    boolean DEFAULT false;
```

### Score Schema Extension

B2B evaluations store additional keys in `mental_health_evaluations.scores` (jsonb):

```json
{
  "srq20": 9,
  "aep_total": 28,
  "aep_pressure": 8,
  "aep_autonomy": 3,
  "aep_breaks": 5,
  "aep_relationships": 4,
  "aep_cognitive": 6,
  "aep_environment": 2
}
```

No migration needed — `scores` is already jsonb.

### Storage Buckets (New)

| Bucket | Purpose | Access |
|--------|---------|--------|
| `nr1-inventories` | Generated NR-1 inventory PDFs | Private (service role) |
| `company-documents` | Uploaded company PDFs for AI extraction | Private (service role) |
| `company-signatures` | SST signature images | Private (service role) |

---

## 8. B2B Assessment Form — Step Configuration

When `companyContext` is present in `AssessmentPage.tsx`, the step set changes completely:

### B2B Mode Steps (replaces ALL_STEPS)

```
B2B_STEPS = [
  { id: 'welcome-b2b',       component: WelcomeStep (B2B variant) },
  { id: 'personal-data',     component: PersonalDataStep (subset: name, email, cpf, dob, sex, cargo, matricula) },
  { id: 'srq20',             component: SRQ20Step },
  { id: 'aep',               component: AEPStep (14 Likert + Q15 open) },
  { id: 'canal-percepcao',   component: CanalPercepcaoStep },
  { id: 'b2b-consents',      component: B2BConsentsStep },
  { id: 'summary-b2b',       component: SummaryStep (B2B variant) },
]
```

The existing clinical scales (PHQ-9, GAD-7, ISI, etc.) are NOT shown. If the company has BrightPrecision enabled (future scope), additional clinical steps are inserted between AEP and Canal.

---

## 9. NR-1 Compliance Computation

The compliance API computes a 17-item checklist from real system data:

| # | NR-1 Ref | Requirement | Computation |
|---|----------|-------------|-------------|
| 1 | 1.5.7.1.a | PGR contains risk inventory | evaluations with SRQ-20/AEP exist AND `nr1_process_descriptions` filled |
| 2 | 1.5.7.1.b | PGR contains action plan | `b2b_action_plans.count > 0` |
| 3 | 1.5.3.1.4 | Inventory includes psychosocial factors | SRQ-20 scores exist in evaluations |
| 4 | 1.5.7.3.2 | Inventory has 9 mandatory fields | All 3 company fields + 6 computed fields available |
| 5 | 1.5.3.2.1 | NR-17 ergonomic evaluation (AEP) | AEP scores exist in evaluations |
| 6 | 1.5.4.4.2 | Risk classification with levels | Risk distribution computed (always true if evaluations exist) |
| 7 | 1.5.4.4.2.2 | Grading criteria documented | Static: always conforme (methodology is built-in) |
| 8 | 1.5.5.2.2 | Action plan with timeline + responsible | action plans with deadline + responsible filled |
| 9 | 1.5.5.2.2 | Action plan with result measurement | action plans with status tracking active |
| 10 | 1.5.7.2 | Documents dated and signed | `gro_issued_at IS NOT NULL` |
| 11 | 1.5.7.2.1 | PGR available to workers | Static: conforme (laudo delivered to employees) |
| 12 | 1.5.3.3.a | Worker participation mechanism | `b2b_percepcao_reports.count > 0` OR canal configured |
| 13 | 1.5.3.3.b | Worker perception consulted | SRQ-20 + AEP administered |
| 14 | 1.5.3.3.c | Risks communicated to workers | Employees receive Laudo Individual |
| 15 | 1.5.6.1 | Emergency response procedures | `emergency_sop_urls` has entries |
| 16 | 1.5.7.3.3.1 | 20-year data retention | Show as "Pendente" (infrastructure scope) |
| 17 | 1.5.5.5 | Accident/disease analysis | `b2b_events` with afastamento type exist |

---

## 10. PDF Upload + AI Extraction Pipeline

### Extraction Types

**NR-1 Fields Extraction** (`extractionType: 'nr1-fields'`)
- Input: Company internal documents (process manuals, SOPs, job descriptions)
- AI prompt: Extract (1) process descriptions, (2) activity descriptions, (3) existing preventive measures
- Output: `{ process_descriptions: Record<string, string>, activities: Record<string, string>, preventive_measures: string[] }`

**Events Bulk Import** (`extractionType: 'events-bulk'`)
- Input: HR spreadsheet exported to PDF, or sick leave records
- AI prompt: Extract structured event list (date, type, CID code, description, department, days)
- Output: `{ events: Array<{ event_date, event_type, cid_code?, description, department?, days_lost? }> }`

### API Flow

```
POST /api/b2b/[companyId]/extract-pdf
  body: { fileUrl: string, extractionType: 'nr1-fields' | 'events-bulk' }

  1. Download PDF from Supabase storage URL
  2. Convert PDF text via pdf-parse (or similar)
  3. Claude API call with extraction-specific system prompt + PDF text
  4. Parse structured response
  5. Return extracted data for client-side review

  Response: { extracted: <structured data>, confidence: number, warnings: string[] }
```

---

## 11. Implementation Order

1. Database migrations (new tables, column extensions, storage buckets)
2. SRQ-20 + AEP scale definitions + scoring functions
3. B2B assessment form steps (SRQ20Step, AEPStep, CanalPercepcaoStep, B2BConsentsStep)
4. Assessment submission branching (B2B → laudo pipeline)
5. LangGraph agent infrastructure (`agents/shared/`) + B2B Laudo agent (`agents/b2b-laudo/`) + PDF builder
6. New CRUD API routes (action plans, events, percepcao, GRO, employee tracking)
7. Modified aggregation APIs (overview, departments, domains with SRQ-20/AEP)
8. Compliance API rewrite (17-item computed checklist)
9. Dashboard shell rewrite (new tab structure, filter bar)
10. Dashboard tab implementations (Overview, Setores, GRO, Action Plans, Events, Compliance, Reports)
11. NR-1 Inventory PDF generation
12. PDF extraction agent (`agents/pdf-extraction/`) + action plan generator agent (`agents/action-plan-generator/`)
13. Employee tracking / onboarding component
14. Settings tab extensions (NR-1 fields, PDF upload)
15. Reports tab with filtering and generation

---

## 12. Dependencies

### External Packages (already installed)

| Package | Usage |
|---------|-------|
| `@tanstack/react-query` | Data fetching hooks |
| `jspdf` | PDF generation (Laudo Individual, NR-1 Inventory) |
| `@supabase/supabase-js` | Database access in API routes |
| `nuqs` | URL-based filter state |
| `recharts` or `chart.js` | Dashboard charts (check which is currently used) |

### Packages to Add

| Package | Usage |
|---------|-------|
| `@langchain/langgraph` | StateGraph for all AI pipelines — NOT the same as `@langchain/langgraph-sdk` (already installed, that's the platform client) |
| `langsmith` | Tracing SDK — `ensureTracingFlushed()` / `awaitAllCallbacks()` for Vercel |
| `pdf-parse` | Extract text from uploaded PDFs in API routes |

Already installed (no action): `@langchain/anthropic`, `@langchain/core`, `@langchain/openai`, `@langchain/google-genai`, `zod`, `zod-to-json-schema`

### Existing Services (with file paths)

| Service | Path | Usage |
|---------|------|-------|
| **LLM Service** | `shared/utils/llm/` | **All AI calls go through this.** Multi-provider, structured output, retry, fallback. `llmService` singleton, `getAnthropicConfigForTask()`, `invokeStructuredOutput()` |
| B2B auth | `app/api/b2b/lib/getB2BUser.ts` | Auth for all B2B API routes |
| Risk computation | `app/api/b2b/lib/riskUtils.ts` | Normalized scores + risk levels |
| PDF builder | `app/api/assessment/generate-pdf/pdf-helpers.ts` | Reference for laudo PDF (jspdf patterns, fonts, header/footer) |
| Email/webhooks | `app/api/assessment/lib/send-email.ts` | Webhook delivery |
| Score computation | `features/assessment/helpers/compute-scores.ts` | Base for SRQ-20/AEP scoring |
| Form interface | `features/assessment/components/assessment.interface.ts` | Extend for B2B fields |
| Step definitions | `features/assessment/components/constants/steps.ts` | Add B2B step set |
| Dashboard shell | `features/b2b-dashboard/components/B2BDashboardComponent.tsx` | Rewrite tab structure |
| Domain mapping | `features/b2b-dashboard/constants/domain-mapping.ts` | Add SRQ-20/AEP |

### Environment Variables

Existing (no change): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`

New (add to Vercel + `.env.local`):

| Variable | Value | Purpose |
|----------|-------|---------|
| `LANGSMITH_TRACING` | `true` | Enable LangSmith tracing for all LangGraph agents |
| `LANGSMITH_API_KEY` | `lsv2_...` | LangSmith API key |
| `LANGCHAIN_CALLBACKS_BACKGROUND` | `false` | **Required for Vercel** — flush traces before serverless function exits |
| `LANGCHAIN_PROJECT` | `brightmonitor-nr1` | LangSmith project name for organizing traces |

---

## 13. Future Enhancements (Explicitly NOT in Scope)

- **eSocial integration** — government system integration, separate project
- **AWS S3 + Glacier** — 20-year data retention infrastructure
- **Notification system** — email/in-platform notifications for deadlines and events
- **Industry benchmarks** — radar chart comparison lines (requires dataset)
- **ICP-Brasil digital signatures** — legally certified digital signatures
- **BrightPrecision add-on** — enabling full clinical scales in B2B form
- **Portal do Colaborador** — employee-facing portal with sector map and booklets
- **Laudo CFM / CIAT reports** — specialized regulatory report formats
- **Automated correlations** — cross-referencing percepcao data with risk inventory
- **Email reminders** — sending completion reminders to employees
