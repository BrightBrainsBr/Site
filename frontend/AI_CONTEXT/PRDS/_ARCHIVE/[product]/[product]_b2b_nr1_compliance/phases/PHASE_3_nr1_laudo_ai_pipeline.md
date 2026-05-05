# BrightMonitor NR-1 — Phase 3: LangGraph Agent Infrastructure + B2B Laudo Agent

**Cursor Agent:** /backend-engineer
**Wave:** 1 (parallel with Phase 2)
**Objective:** Set up the LangGraph TypeScript agent infrastructure (`agents/shared/`) and build the B2B Laudo Individual agent (`agents/b2b-laudo/`) with proper `models/`, `prompts/`, `services/` structure. Wire the assessment submission flow to invoke this agent for B2B evaluations.
**Depends on:** Phase 1 (new columns on `mental_health_evaluations`)

**Files owned by this phase:**
- `frontend/agents/shared/errors.ts` (new)
- `frontend/agents/shared/tracing.ts` (new)
- `frontend/shared/utils/llm/helpers/anthropicTaskConfig.ts` (modify — add B2B task types)
- `frontend/agents/b2b-laudo/models/b2b-laudo.interface.ts` (new)
- `frontend/agents/b2b-laudo/models/b2b-laudo.state.ts` (new)
- `frontend/agents/b2b-laudo/prompts/b2b-laudo.prompts.ts` (new)
- `frontend/agents/b2b-laudo/services/b2b-laudo.graph.ts` (new)
- `frontend/agents/b2b-laudo/services/b2b-laudo.nodes.ts` (new)
- `frontend/agents/b2b-laudo/services/b2b-laudo.storage.ts` (new)
- `frontend/app/api/assessment/submit/route.ts` (modify)
- `frontend/app/api/assessment/continue-report/route.ts` (modify)
- `frontend/app/api/assessment/lib/send-email.ts` (modify)

---

## 1. Files to Create

```
agents/
├── shared/
│   ├── errors.ts
│   └── tracing.ts
│
└── b2b-laudo/
    ├── models/
    │   ├── b2b-laudo.interface.ts
    │   └── b2b-laudo.state.ts
    ├── prompts/
    │   └── b2b-laudo.prompts.ts
    └── services/
        ├── b2b-laudo.graph.ts
        ├── b2b-laudo.nodes.ts
        └── b2b-laudo.storage.ts
```

## 2. What to Build

### Install Dependencies

```bash
npm install @langchain/langgraph langsmith
```

Already installed: `@langchain/anthropic`, `@langchain/core`, `@langchain/openai`, `@langchain/google-genai`, `zod`, `zod-to-json-schema`.

### LLM Calls — Use Existing `shared/utils/llm`

**All AI calls go through the existing `llmService` singleton** from `shared/utils/llm`. No new LLM wrapper.

**Modify** `shared/utils/llm/helpers/anthropicTaskConfig.ts` — add B2B task types:

```typescript
const COMPLEX_TASKS = new Set([
  // ... existing ...
  'b2b_laudo_generation',
])

const MODERATE_TASKS = new Set([
  // ... existing ...
  'pdf_extraction',
  'action_plan_generation',
])
```

For `b2b_laudo_generation`: `enable_thinking: true`, `thinking_budget_tokens: 10000`, `max_tokens: 16000`.

---

### `agents/shared/errors.ts`

```typescript
class AgentError extends Error {
  constructor(message: string, public node: string, public cause?: unknown)
}

class RetryableError extends AgentError {}

const DEFAULT_RETRY_POLICY = {
  maxAttempts: 3,
  retryOn: (error: Error) => error instanceof RetryableError,
}
```

### `agents/shared/tracing.ts`

```typescript
async function ensureTracingFlushed(): Promise<void>
```

- Calls `awaitAllCallbacks()` from `@langchain/core/callbacks/promises`
- **Must be called** at the end of every API route that invokes an agent
- Critical for Vercel: without this, traces are lost when the serverless function exits

---

### `agents/b2b-laudo/models/b2b-laudo.interface.ts`

TypeScript types for the agent's domain:

```typescript
interface CompanyLaudoData {
  name: string
  cnpj: string
  cnae: string
  risk_grade: string
  sst_responsible_name?: string
  sst_signature_url?: string
}

interface PreviousEvaluationSummary {
  cycle_label: string
  created_at: string
  scores: Record<string, number>
  risk_level: string
}

interface LaudoSections {
  section4_clinical: string
  section5_aep: string
  section6_risk: string
  section7_pdca: string
  section8_trends: string
}

interface LaudoGenerationInput {
  evaluationId: string
}

interface LaudoGenerationOutput {
  pdfUrl: string
  laudoMarkdown: string
}
```

### `agents/b2b-laudo/models/b2b-laudo.state.ts`

LangGraph StateSchema using Zod. Imports Zod schemas derived from the interfaces above.

```typescript
import { StateSchema } from '@langchain/langgraph'
import * as z from 'zod'

const CompanyLaudoDataSchema = z.object({
  name: z.string(),
  cnpj: z.string(),
  cnae: z.string(),
  risk_grade: z.string(),
  sst_responsible_name: z.string().optional(),
  sst_signature_url: z.string().optional(),
})

const PreviousEvaluationSummarySchema = z.object({
  cycle_label: z.string(),
  created_at: z.string(),
  scores: z.record(z.number()),
  risk_level: z.string(),
})

export const B2BLaudoState = new StateSchema({
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

### `agents/b2b-laudo/prompts/b2b-laudo.prompts.ts`

**`B2B_LAUDO_SYSTEM`**: System prompt that instructs Claude to generate the interpretive sections of the Laudo Individual:

- Receive employee scores (SRQ-20 total + per-group, AEP total + per-dimension, clinical scales if present)
- Generate personalized text for sections 4-8:
  - Section 4: Clinical scale interpretation (per-scale narrative — NOT just restating numbers)
  - Section 5: AEP dimension analysis (what the scores mean for workplace conditions)
  - Section 6: Integrated risk classification narrative (probability × severity explanation)
  - Section 7: Individual PDCA actions (3-5 personalized recommendations based on risk profile)
  - Section 8: Trend analysis (if history data exists)
- Output structured markdown with `## SECTION_N` markers
- Tone: professional, NR-1 compliant, CFM language, but accessible
- NEVER include CID codes (screening, not diagnosis)
- Maximum ~3000 tokens output

**`buildLaudoUserMessage(state)`**: Builds the user message from state:

```
Colaborador: {name}, {age} anos, {cargo}, setor {department}
Empresa: {company_name} (CNAE {cnae})
Scores: SRQ-20={srq20} (grupos: {srq20_groups}), AEP={aep_total}/56 (dimensões: {aep_dims})
{clinical_scores_if_present}
Histórico: {history_summary}
```

### `agents/b2b-laudo/services/b2b-laudo.storage.ts`

All Supabase operations for this agent, isolated from node logic:

```typescript
const b2bLaudoStorage = {
  async fetchEvaluation(evaluationId: string): Promise<{ formData, scores, companyId }>
  async fetchCompany(companyId: string): Promise<CompanyLaudoData>
  async fetchHistory(email: string, companyId: string, limit?: number): Promise<PreviousEvaluationSummary[]>
  async uploadPdf(evaluationId: string, pdfBuffer: Buffer): Promise<string>  // returns URL
  async updateEvaluation(evaluationId: string, data: { laudo_pdf_url, laudo_markdown, status }): Promise<void>
}
```

Uses Supabase service role client. Each method is a clean, testable unit.

### `agents/b2b-laudo/services/b2b-laudo.nodes.ts`

All node functions in one file. Each returns a state patch.

**`loadContext(state)`**:
1. Call `b2bLaudoStorage.fetchEvaluation(state.evaluationId)`
2. Call `b2bLaudoStorage.fetchCompany(companyId)`
3. Call `b2bLaudoStorage.fetchHistory(email, companyId)`
4. Return `{ formData, scores, companyData, historyData, status: 'context_loaded' }`
5. On error: return `{ errors: [...state.errors, message], status: 'error' }`

**`generateText(state)`**:
1. Import `llmService, getAnthropicConfigForTask, toLangChainMessages` from `shared/utils/llm`
2. Import `B2B_LAUDO_SYSTEM, buildLaudoUserMessage` from `../prompts/b2b-laudo.prompts`
3. Get LLM: `llmService.getLlmInstance(getAnthropicConfigForTask('b2b_laudo_generation'))`
4. Build messages, invoke LLM
5. Return `{ laudoMarkdown: content, status: 'text_generated' }`
6. Wrap LLM errors as `RetryableError`

**`buildPdf(state)`**:
Uses jspdf. Reference `app/api/assessment/generate-pdf/pdf-helpers.ts` for patterns.
- Page 1 (Identification): Pure data tables — employee, company, evaluation metadata. Laudo ID: `BM-{YYYY}-{5-digit}`.
- Page 2 (Results): Clinical scales table (color-coded risk). AEP dimensions table. AEP Q15 text.
- Page 3 (Risk + PDCA): 3×4 risk matrix grid, highlighted cell. AI narrative from `laudoMarkdown`. PDCA table.
- Page 4 (History + Notes): History table. Methodological note. Signatures (Dra. Soraya + SST).
- Branded header/footer, LGPD confidentiality stamp.
- Return `{ pdfBuffer, status: 'pdf_built' }`

**`storeResult(state)`**:
1. Call `b2bLaudoStorage.uploadPdf(state.evaluationId, state.pdfBuffer)`
2. Call `b2bLaudoStorage.updateEvaluation(state.evaluationId, { ... })`
3. Send webhook via `sendReportEmail()` with event `b2b_laudo_ready`
4. Return `{ pdfUrl, status: 'stored' }`

### `agents/b2b-laudo/services/b2b-laudo.graph.ts`

```typescript
import { StateGraph, START, END } from '@langchain/langgraph'
import { B2BLaudoState } from '../models/b2b-laudo.state'
import { loadContext, generateText, buildPdf, storeResult } from './b2b-laudo.nodes'

const graph = new StateGraph(B2BLaudoState)
  .addNode('loadContext', loadContext, { retryPolicy: { maxAttempts: 2 } })
  .addNode('generateText', generateText, { retryPolicy: { maxAttempts: 3 } })
  .addNode('buildPdf', buildPdf)
  .addNode('storeResult', storeResult, { retryPolicy: { maxAttempts: 2 } })
  .addEdge(START, 'loadContext')
  .addConditionalEdges('loadContext', (state) => state.errors.length > 0 ? END : 'generateText')
  .addConditionalEdges('generateText', (state) => state.errors.length > 0 ? END : 'buildPdf')
  .addConditionalEdges('buildPdf', (state) => state.errors.length > 0 ? END : 'storeResult')
  .addEdge('storeResult', END)

export const b2bLaudoGraph = graph.compile()
```

---

### Modifications to Existing Files

**`submit/route.ts`**: After existing insert logic:
- If `company_id` present → set `report_type = 'b2b-laudo'` on the evaluation row
- Save consent flags: `b2c_consent`, `b2c_consent_at`, `b2c_contact_consent`, `b2c_contact_consent_at`, `b2b_anonymized_consent`
- If `canal_percepcao` data present in formData → INSERT into `b2b_percepcao_reports`
- If `aep_percepcao_livre` present → INSERT into `b2b_percepcao_reports` with `source = 'aep_q15'`
- In `after()`: POST to continue-report with `phase: 'b2b-laudo'` instead of `'stage1'`

**`continue-report/route.ts`**: Add handler for `phase === 'b2b-laudo'`:
1. Import `b2bLaudoGraph` from `agents/b2b-laudo/services/b2b-laudo.graph`
2. Import `ensureTracingFlushed` from `agents/shared/tracing`
3. `await b2bLaudoGraph.invoke({ evaluationId })`
4. `await ensureTracingFlushed()`
5. Return success response

**`send-email.ts`**: Add `b2b_laudo_ready` webhook event type.

## 3. Environment Variables (add to Vercel + `.env.local`)

| Variable | Value | Purpose |
|----------|-------|---------|
| `LANGSMITH_TRACING` | `true` | Enable LangSmith tracing |
| `LANGSMITH_API_KEY` | `lsv2_...` | LangSmith API key |
| `LANGCHAIN_CALLBACKS_BACKGROUND` | `false` | Flush traces before Vercel function exits |
| `LANGCHAIN_PROJECT` | `brightmonitor-nr1` | LangSmith project name |

## 4. Phase Completion Checklist

- [ ] Packages installed: `@langchain/langgraph`, `langsmith`
- [ ] File modified: `shared/utils/llm/helpers/anthropicTaskConfig.ts` — 3 new task types
- [ ] File created: `agents/shared/errors.ts`
- [ ] File created: `agents/shared/tracing.ts`
- [ ] File created: `agents/b2b-laudo/models/b2b-laudo.interface.ts`
- [ ] File created: `agents/b2b-laudo/models/b2b-laudo.state.ts`
- [ ] File created: `agents/b2b-laudo/prompts/b2b-laudo.prompts.ts`
- [ ] File created: `agents/b2b-laudo/services/b2b-laudo.graph.ts`
- [ ] File created: `agents/b2b-laudo/services/b2b-laudo.nodes.ts` — 4 node functions
- [ ] File created: `agents/b2b-laudo/services/b2b-laudo.storage.ts` — 5 storage methods
- [ ] Modified: `submit/route.ts` — B2B branching + consent saving + percepcao insert
- [ ] Modified: `continue-report/route.ts` — agent invocation + tracing flush
- [ ] Modified: `send-email.ts` — new event type
- [ ] LangSmith traces visible for laudo generation runs
- [ ] B2B submission triggers laudo agent (not clinical report)
- [ ] B2C submission still triggers clinical report (unchanged)
- [ ] Error states handled — failed runs have `status: 'error'` with `errors` array

**Next:** `PHASE_4_nr1_new_crud_apis.md` — CRUD routes + PDF extraction agent + action plan generator agent
