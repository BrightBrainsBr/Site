# BrightMonitor NR-1 — Phase 4: New CRUD API Routes + PDF Extraction & Action Plan Agents

**Cursor Agent:** /backend-engineer
**Wave:** 1 (parallel with Phase 2 and 3)
**Objective:** Create all new API routes for action plans, events, percepcao, GRO aggregation, employee tracking, NR-1 inventory, PDF extraction, and filtered reports. Build the PDF extraction and action plan generator LangGraph agents.
**Depends on:** Phase 1 (new tables must exist), Phase 3 (`agents/shared/` + `shared/utils/llm` task configs must exist)

**Files owned by this phase:**
- `frontend/agents/pdf-extraction/models/pdf-extraction.interface.ts` (new)
- `frontend/agents/pdf-extraction/models/pdf-extraction.state.ts` (new)
- `frontend/agents/pdf-extraction/prompts/pdf-extraction.prompts.ts` (new)
- `frontend/agents/pdf-extraction/services/pdf-extraction.graph.ts` (new)
- `frontend/agents/pdf-extraction/services/pdf-extraction.nodes.ts` (new)
- `frontend/agents/pdf-extraction/services/pdf-extraction.storage.ts` (new)
- `frontend/agents/action-plan-generator/models/action-plan-generator.interface.ts` (new)
- `frontend/agents/action-plan-generator/models/action-plan-generator.state.ts` (new)
- `frontend/agents/action-plan-generator/prompts/action-plan-generator.prompts.ts` (new)
- `frontend/agents/action-plan-generator/services/action-plan-generator.graph.ts` (new)
- `frontend/agents/action-plan-generator/services/action-plan-generator.nodes.ts` (new)
- `frontend/agents/action-plan-generator/services/action-plan-generator.storage.ts` (new)
- `frontend/app/api/b2b/[companyId]/gro/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/action-plans/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/action-plans/[planId]/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/events/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/events/[eventId]/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/percepcao/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/employee-tracking/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/nr1-inventory/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/extract-pdf/route.ts` (new)
- `frontend/app/api/b2b/[companyId]/reports/route.ts` (new)

---

## 1. Files to Create

```
agents/
├── pdf-extraction/
│   ├── models/
│   │   ├── pdf-extraction.interface.ts
│   │   └── pdf-extraction.state.ts
│   ├── prompts/
│   │   └── pdf-extraction.prompts.ts
│   └── services/
│       ├── pdf-extraction.graph.ts
│       ├── pdf-extraction.nodes.ts
│       └── pdf-extraction.storage.ts
│
└── action-plan-generator/
    ├── models/
    │   ├── action-plan-generator.interface.ts
    │   └── action-plan-generator.state.ts
    ├── prompts/
    │   └── action-plan-generator.prompts.ts
    └── services/
        ├── action-plan-generator.graph.ts
        ├── action-plan-generator.nodes.ts
        └── action-plan-generator.storage.ts

app/api/b2b/[companyId]/
├── gro/route.ts
├── action-plans/
│   ├── route.ts
│   └── [planId]/route.ts
├── events/
│   ├── route.ts
│   └── [eventId]/route.ts
├── percepcao/route.ts
├── employee-tracking/route.ts
├── nr1-inventory/route.ts
├── extract-pdf/route.ts
└── reports/route.ts
```

## 2. What to Build

### Install Dependencies

```bash
npm install pdf-parse
```

(`@langchain/langgraph`, `langsmith` installed in Phase 3)

---

### PDF Extraction Agent (`agents/pdf-extraction/`)

#### `models/pdf-extraction.interface.ts`

```typescript
interface NR1FieldsOutput {
  process_descriptions: string
  activities: string
  preventive_measures: string
}

interface EventsBulkOutput {
  events: Array<{
    event_date: string
    event_type: 'afastamento' | 'acidente' | 'incidente' | 'queixa' | 'outro'
    cid_code?: string
    description: string
    department?: string
    days_lost?: number
  }>
}

interface ExtractionResult {
  extracted: NR1FieldsOutput | EventsBulkOutput
  confidence: number
  warnings: string[]
}
```

#### `models/pdf-extraction.state.ts`

```typescript
export const PdfExtractionState = new StateSchema({
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

#### `prompts/pdf-extraction.prompts.ts`

Two extraction prompts, selected by `extractionType`:

**`NR1_FIELDS_EXTRACTION_SYSTEM`**: Instructs Claude to extract from company document text:
- `process_descriptions`: description of work processes per department
- `activities`: description of activities per department
- `preventive_measures`: list of existing preventive measures
- Output: JSON with these 3 fields. If information is ambiguous, include in `warnings` array.

**`EVENTS_BULK_EXTRACTION_SYSTEM`**: Instructs Claude to extract structured event list from company records (HR reports, medical leave records, etc.):
- Array of `{ event_date, event_type, cid_code?, description, department?, days_lost? }`
- Event types: `afastamento`, `acidente`, `incidente`, `queixa`, `outro`
- CID codes must be valid ICD-10 format
- Output: JSON with `events` array. Flag ambiguous dates or unrecognized CID codes in `warnings`.

#### `services/pdf-extraction.storage.ts`

```typescript
const pdfExtractionStorage = {
  async downloadPdf(fileUrl: string): Promise<Buffer>
}
```

Downloads PDF from Supabase storage URL via `fetch`, returns buffer.

#### `services/pdf-extraction.nodes.ts`

All node functions in one file:

**`parsePdf(state)`**:
1. Call `pdfExtractionStorage.downloadPdf(state.fileUrl)`
2. Pass buffer to `pdf-parse`, extract text
3. Return `{ rawText, status: 'parsed' }`
4. On error (corrupted PDF, empty text): return `{ errors: [..., message], status: 'error' }`

**`extractData(state)`**:
1. Import `llmService, getAnthropicConfigForTask` from `shared/utils/llm`
2. Select prompt + Zod output schema from `../prompts/pdf-extraction.prompts` based on `state.extractionType`
3. Use `llmService.invokeStructuredOutput()` with `getAnthropicConfigForTask('pdf_extraction')` — gets Zod validation, retry, and fallback for free
4. Return `{ extracted: result.result, status: 'extracted' }`
5. On `StructuredOutputError`: push to `errors` array

**`validateOutput(state)`**:
1. Validate `extracted` against expected schema per `extractionType`
2. Compute confidence score (0-1): start at 1.0, deduct 0.1 per missing field, 0.05 per warning, floor at 0.1
3. Collect warnings for missing fields, ambiguous data, unexpected formats
4. Return `{ extracted, confidence, warnings, status: 'validated' }`

#### `services/pdf-extraction.graph.ts`

```typescript
import { StateGraph, START, END } from '@langchain/langgraph'
import { PdfExtractionState } from '../models/pdf-extraction.state'
import { parsePdf, extractData, validateOutput } from './pdf-extraction.nodes'

const graph = new StateGraph(PdfExtractionState)
  .addNode('parsePdf', parsePdf)
  .addNode('extractData', extractData, { retryPolicy: { maxAttempts: 3 } })
  .addNode('validateOutput', validateOutput)
  .addEdge(START, 'parsePdf')
  .addConditionalEdges('parsePdf', (state) => state.errors.length > 0 ? END : 'extractData')
  .addConditionalEdges('extractData', (state) => state.errors.length > 0 ? END : 'validateOutput')
  .addEdge('validateOutput', END)

export const pdfExtractionGraph = graph.compile()
```

---

### Action Plan Generator Agent (`agents/action-plan-generator/`)

#### `models/action-plan-generator.interface.ts`

```typescript
interface GROContext {
  scaleAverages: Record<string, number>
  aepDimensions: Record<string, number>
  srq20Distribution: { negative: number, moderate: number, elevated: number, critical: number }
  riskMatrix: number[][]
  departmentName?: string
}

interface GeneratedActionItem {
  description: string
  priority: 'alta' | 'media' | 'baixa'
  responsible: string
  deadline_suggestion: string
  notes: string
}
```

#### `models/action-plan-generator.state.ts`

```typescript
export const ActionPlanState = new StateSchema({
  companyId: z.string(),
  department: z.string().optional(),
  cycleId: z.string().optional(),
  groData: GROContextSchema.default({}),
  generatedItems: z.array(GeneratedActionItemSchema).default([]),
  status: z.enum(['init', 'context_loaded', 'generated', 'error']).default('init'),
  errors: z.array(z.string()).default([]),
})
```

#### `prompts/action-plan-generator.prompts.ts`

**`ACTION_PLAN_SYSTEM`**: Instructs Claude to generate 3-5 PDCA action items based on GRO risk data. Each item must have:
- `description`: specific, actionable intervention (not generic)
- `priority`: alta/media/baixa — based on risk severity
- `responsible`: suggested role (e.g. "Psicólogo Organizacional", "RH", "Gestor de Setor")
- `deadline_suggestion`: relative timeframe (e.g. "30 dias", "60 dias")
- `notes`: brief justification referencing the specific risk factor

**`buildGroContextMessage(groData, department?)`**: Templates GRO data into user message.

Tone: NR-1 compliant, practical, department-specific if department data available.

#### `services/action-plan-generator.storage.ts`

```typescript
const actionPlanStorage = {
  async fetchGroAggregation(companyId: string, cycleId?: string, department?: string): Promise<GROContext>
}
```

Queries `mental_health_evaluations`, computes scale averages + AEP dimensions + SRQ-20 distribution. Same logic as `gro/route.ts` but returns typed `GROContext`.

#### `services/action-plan-generator.nodes.ts`

All node functions in one file:

**`loadGroData(state)`**:
1. Call `actionPlanStorage.fetchGroAggregation(state.companyId, state.cycleId, state.department)`
2. Return `{ groData, status: 'context_loaded' }`

**`generatePlans(state)`**:
1. Import `llmService, getAnthropicConfigForTask` from `shared/utils/llm`
2. Import prompts from `../prompts/action-plan-generator.prompts`
3. Build prompt messages with `buildGroContextMessage(state.groData, state.department)`
4. `const { result } = await llmService.invokeStructuredOutput({ promptMessages, outputSchema: z.array(GeneratedActionItemSchema), primaryConfigDict: getAnthropicConfigForTask('action_plan_generation') })`
5. Return `{ generatedItems: result, status: 'generated' }`

#### `services/action-plan-generator.graph.ts`

```typescript
import { StateGraph, START, END } from '@langchain/langgraph'
import { ActionPlanState } from '../models/action-plan-generator.state'
import { loadGroData, generatePlans } from './action-plan-generator.nodes'

const graph = new StateGraph(ActionPlanState)
  .addNode('loadGroData', loadGroData)
  .addNode('generatePlans', generatePlans, { retryPolicy: { maxAttempts: 3 } })
  .addEdge(START, 'loadGroData')
  .addConditionalEdges('loadGroData', (state) => state.errors.length > 0 ? END : 'generatePlans')
  .addEdge('generatePlans', END)

export const actionPlanGraph = graph.compile()
```

---

### API Routes

All routes use `getB2BUser(request, companyId)` for auth (existing pattern). All accept `?cycle=<uuid>` for cycle scoping via `resolveCycle()`.

### `gro/route.ts` — GET

Query `mental_health_evaluations` for company + cycle. Compute:

```typescript
{
  scaleAverages: { phq9: number, gad7: number, srq20: number, pss10: number, mbi: number, isi: number },
  aepDimensions: { pressure: number, autonomy: number, breaks: number, relationships: number, cognitive: number, environment: number },
  srq20Distribution: { negative: number, moderate: number, elevated: number, critical: number },
  riskMatrix: number[][]  // 3 rows (prob alta/media/baixa) × 4 cols (sev baixa/moderada/alta/muito_alta)
}
```

Risk matrix computation: probability = average of clinical scales normalized (0-100); severity = AEP + event history. Map each employee to a cell. Count per cell.

### `action-plans/route.ts` — GET + POST

**GET**: Query `b2b_action_plans` for company. Support query params: `?status=pendente`, `?department=Marketing`, `?cycle=<uuid>`.

**POST**: Insert into `b2b_action_plans`. Body: `{ description, department?, priority, responsible?, deadline?, notes? }`.

If body includes `generate: true`:
1. Import `actionPlanGraph` from `agents/action-plan-generator/services/action-plan-generator.graph`
2. Import `ensureTracingFlushed` from `agents/shared/tracing`
3. `const result = await actionPlanGraph.invoke({ companyId, department, cycleId })`
4. Insert all `result.generatedItems` into `b2b_action_plans` with `ai_generated = true`
5. `await ensureTracingFlushed()`
6. Return the created items

### `action-plans/[planId]/route.ts` — PATCH + DELETE

**PATCH**: Update fields. Set `updated_at = now()`.
**DELETE**: Delete row. Verify company ownership.

### `events/route.ts` — GET + POST

**GET**: Query `b2b_events` for company. Return events + KPI aggregation:
```typescript
{
  events: B2BEvent[],
  kpis: {
    afastamentos90d: number,
    diasPerdidos: number,
    relatosCanal: number
  }
}
```

Support filters: `?type=afastamento`, `?department=X`, `?from=2026-01-01&to=2026-03-31`.

**POST**: Insert single event or bulk (array). Body: `{ event_date, event_type, cid_code?, description, department?, days_lost?, source? }` or `{ events: [...] }` for bulk from PDF extraction.

### `events/[eventId]/route.ts` — PATCH + DELETE

Standard CRUD. Verify company ownership.

### `percepcao/route.ts` — GET

Query `b2b_percepcao_reports` for company + cycle. Return:

```typescript
{
  total: number,
  byType: Record<string, number>,
  urgentes: number,
  topSetor: string,
  reports: Array<{ id, report_type, urgencia, department, impacto, descricao, sugestao?, source, created_at }>,
  correlations: Array<{ description: string, severity: 'alta' | 'media' }>
}
```

Correlations: simple rule — if percepcao type matches a high-score dimension in GRO for the same department, flag it.

### `employee-tracking/route.ts` — GET

Query `company_access_codes` for company + cycle. Return:

```typescript
{
  total: number,
  completed: number,
  started: number,
  pending: number,
  completionPct: number,
  byDepartment: Array<{ name: string, total: number, completed: number, pct: number }>,
  employees: Array<{ email: string, department: string, status: 'pendente' | 'iniciou' | 'completou', started_at?, completed_at? }>
}
```

Status logic: `used_at` set → completou; `started_at` set but no `used_at` → iniciou; neither → pendente.

### `nr1-inventory/route.ts` — POST + GET

**POST**: Generate 9-field NR-1 inventory PDF.
1. Compute 6 automated fields from `mental_health_evaluations` scores:
   - Perigos identificados (from elevated scale scores)
   - Possíveis agravos (from score-to-condition mapping)
   - Grupos de exposição (from departments with evaluations)
   - Fontes de exposição (from elevated AEP dimensions)
   - Análise preliminar (from risk matrix summary)
   - Classificação de risco (from risk distribution counts)
2. Pull 3 company fields: `nr1_process_descriptions`, `nr1_activities`, `nr1_preventive_measures`
3. Generate PDF using jspdf with NR-1 legal formatting
4. Upload to `nr1-inventories` bucket
5. Return `{ url: string, generated_at: string }`

**GET**: Return latest inventory PDF URL for the company.

### `extract-pdf/route.ts` — POST

Body: `{ fileUrl: string, extractionType: 'nr1-fields' | 'events-bulk' }`

1. Import `pdfExtractionGraph` from `agents/pdf-extraction/services/pdf-extraction.graph`
2. Import `ensureTracingFlushed` from `agents/shared/tracing`
3. `const result = await pdfExtractionGraph.invoke({ fileUrl, extractionType })`
4. `await ensureTracingFlushed()`
5. Return `{ extracted: result.extracted, confidence: result.confidence, warnings: result.warnings }`

### `reports/route.ts` — POST

Body: `{ reportType: 'gro-consolidado' | 'departamento' | 'csv', filters: { department?, riskLevel?, dateFrom?, dateTo? } }`

1. Query evaluations with filters
2. Based on `reportType`:
   - `gro-consolidado`: Generate PDF with dashboard data snapshot
   - `departamento`: Generate per-department breakdown PDF
   - `csv`: Generate CSV with evaluation data
3. Upload to `nr1-inventories` bucket (or return inline for CSV)
4. Return `{ url: string, filename: string }`

## 3. Phase Completion Checklist

### PDF Extraction Agent
- [ ] File created: `agents/pdf-extraction/models/pdf-extraction.interface.ts`
- [ ] File created: `agents/pdf-extraction/models/pdf-extraction.state.ts`
- [ ] File created: `agents/pdf-extraction/prompts/pdf-extraction.prompts.ts`
- [ ] File created: `agents/pdf-extraction/services/pdf-extraction.graph.ts`
- [ ] File created: `agents/pdf-extraction/services/pdf-extraction.nodes.ts`
- [ ] File created: `agents/pdf-extraction/services/pdf-extraction.storage.ts`

### Action Plan Generator Agent
- [ ] File created: `agents/action-plan-generator/models/action-plan-generator.interface.ts`
- [ ] File created: `agents/action-plan-generator/models/action-plan-generator.state.ts`
- [ ] File created: `agents/action-plan-generator/prompts/action-plan-generator.prompts.ts`
- [ ] File created: `agents/action-plan-generator/services/action-plan-generator.graph.ts`
- [ ] File created: `agents/action-plan-generator/services/action-plan-generator.nodes.ts`
- [ ] File created: `agents/action-plan-generator/services/action-plan-generator.storage.ts`
- [ ] LangSmith traces visible for PDF extraction and action plan generation

### API Routes
- [ ] Route created: `gro/route.ts` with all 4 data sections
- [ ] Route created: `action-plans/route.ts` (GET + POST with agent-powered generation)
- [ ] Route created: `action-plans/[planId]/route.ts` (PATCH + DELETE)
- [ ] Route created: `events/route.ts` (GET + POST) with bulk support
- [ ] Route created: `events/[eventId]/route.ts` (PATCH + DELETE)
- [ ] Route created: `percepcao/route.ts` with correlations
- [ ] Route created: `employee-tracking/route.ts` with department breakdown
- [ ] Route created: `nr1-inventory/route.ts` (POST generate + GET download)
- [ ] Route created: `extract-pdf/route.ts` invoking PDF extraction agent
- [ ] Route created: `reports/route.ts` with 3 report types
- [ ] All routes use `getB2BUser` auth pattern
- [ ] All routes support `?cycle=` param where applicable
- [ ] All routes invoking agents call `ensureTracingFlushed()` before response

**Next:** `PHASE_5_nr1_modified_apis.md` — Modify existing B2B APIs for SRQ-20/AEP data
