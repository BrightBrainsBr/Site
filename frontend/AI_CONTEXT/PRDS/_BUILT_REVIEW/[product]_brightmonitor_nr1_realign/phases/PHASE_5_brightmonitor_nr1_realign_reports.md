# BrightMonitor NR-1 — Phase 5: PGR Generator + Análise IA Panel

**Cursor Agent:** /frontend-engineer
**Wave:** 3
**Objective:** Build the 6-document PGR generator and 4-view Análise IA panel. Create the prompt templates, context aggregator, API routes, PDF rendering via existing `pdf-helpers.ts`, and integrate into the Reports tab UI.
**Depends on:** Phase 4 (dashboard data routes work with NR-1 data), Phase 1 (DB tables)

**Files owned by this phase:**

New files:
- `frontend/app/api/brightmonitor/[companyId]/reports/pgr/[slug]/route.ts`
- `frontend/app/api/brightmonitor/[companyId]/reports/analise-ia/[slug]/route.ts`
- `frontend/app/api/brightmonitor/[companyId]/reports/lib/build-context.ts`
- `frontend/app/api/brightmonitor/[companyId]/reports/lib/pgr-prompts.ts`
- `frontend/app/api/brightmonitor/[companyId]/reports/lib/analise-prompts.ts`
- `frontend/features/b2b-dashboard/hooks/useBrightMonitorPGRMutationHook.ts`
- `frontend/features/b2b-dashboard/hooks/useBrightMonitorAnaliseIAQueryHook.ts`

Modified files:
- `frontend/app/api/brightmonitor/[companyId]/reports/route.ts` (retire/redirect)
- `frontend/features/b2b-dashboard/components/tabs/B2BReportsTab.tsx`

---

## 1. Files to Create

```
frontend/app/api/brightmonitor/[companyId]/reports/
├── route.ts                          # RETIRE — 410 redirect to new sub-routes
├── pgr/
│   └── [slug]/
│       └── route.ts                  # POST — generate PGR document by slug
├── analise-ia/
│   └── [slug]/
│       └── route.ts                  # POST — generate AI analysis view by slug
└── lib/
    ├── build-context.ts              # PGR context aggregator
    ├── pgr-prompts.ts                # 6 PGR prompt templates
    └── analise-prompts.ts            # 4 Análise IA prompt templates

frontend/features/b2b-dashboard/hooks/
├── useBrightMonitorPGRMutationHook.ts
└── useBrightMonitorAnaliseIAQueryHook.ts
```

## 2. What to Build

### 2a. `build-context.ts` — PGR Context Aggregator

Aggregates all data a PGR prompt needs from Supabase. Single function, called by both PGR and Análise IA routes.

```typescript
interface PGRContext {
  company: {
    name: string; cnpj: string; cnae: string | null;
    departments: string[];
    sst_responsible_name: string | null; sst_responsible_role: string | null;
    nr1_process_descriptions: Record<string, string> | null;
    nr1_activities: Record<string, string> | null;
    nr1_preventive_measures: string[] | null;
  };
  cycle: { id: string; label: string; starts_at: string; ends_at: string } | null;
  assessmentCount: number;
  domainScores: {
    physical: number | null; ergonomic: number | null;
    psychosocial: number | null; violence: number | null; overall: number | null;
  };
  scoresByDepartment: Record<string, {
    physical: number; ergonomic: number; psychosocial: number; violence: number; n: number;
  }>;
  psychosocialAxes: Record<string, number>;
  inventory: Array<{ id: string; description: string; risk_type: string; probability: string; severity: string }>;
  actions: Array<{ description: string; status: string; responsible: string | null; deadline: string | null; priority: string }>;
  incidents: { accidents: number; nearMisses: number; workDiseases: number; total: number };
  harassmentCount: number;
  chemicalExposures: Record<string, number>;
  biologicalExposures: Record<string, number>;
  perceptionSummary: { avgSatisfaction: number | null; topRisks: string[]; topSuggestions: string[] };
}

export async function buildPGRContext(companyId: string, cycleId?: string): Promise<PGRContext>;
```

Implementation queries:
1. `companies` — company metadata + NR-1 fields
2. `assessment_cycles` — resolve cycle (current or specified)
3. `mental_health_evaluations` — filter by `company_id`, `cycle_id`, `assessment_kind = 'nr1'`. Compute means for all domain scores. Aggregate psychosocial axes. Count chemical/biological exposures. Aggregate perception fields.
4. `b2b_action_plans` — action items for the company
5. `b2b_events` — incident counts
6. `harassment_reports` — count only (no individual rows)

### 2b. `pgr-prompts.ts` — 6 PGR Prompt Templates

Each function returns `{ system: string; user: string }`. The system prompt sets the persona (NR-1 compliance specialist), output format (markdown with specific section headers), and legal references. The user prompt injects the PGR context data.

| Slug | Function | NR-1 Ref | Key Context Data |
|---|---|---|---|
| `inventario` | `getInventarioPrompt` | § 1.5.4 | inventory rows, domain scores, chemical/biological exposures |
| `plano` | `getPlanoPrompt` | § 1.5.5 | action plans, 5W2H format |
| `psicossocial` | `getPsicossocialPrompt` | § 1.5.3.2.1 | psychosocial axes, violence scores, per-dept breakdown |
| `pgr-completo` | `getPGRCompletoPrompt` | § 1.5 | everything — full context |
| `anti-assedio` | `getAntiAssedioPrompt` | § 1.4.1.1 | harassment count, violence scores, incident data |
| `os-sst` | `getOSSSTPrompt` | § 1.4.1 c | per-role hazards from exposures, domain scores by dept |

**Prompt structure guidance:**
- System prompt: ~500-800 tokens. Sets NR-1 specialist persona, markdown output format, required sections, legal article references.
- User prompt: ~1000-3000 tokens (varies by document type). Injects the full PGR context as structured data (JSON or formatted text).
- Use the same Anthropic SDK client as the existing `continue-report` pipeline. Model: `claude-sonnet-4-6` with OpenRouter fallback.
- Section headers should match Bernardo's prototype structure (the legally meaningful part). See `claude_artifact/teste-monitor-brightbrains/` for reference.

### 2c. `analise-prompts.ts` — 4 Análise IA Templates

```typescript
export function getAnaliseGeralPrompt(ctx: PGRContext): { system: string; user: string };
export function getAnalisePsicossocialPrompt(ctx: PGRContext): { system: string; user: string };
export function getAnaliseCriticosPrompt(ctx: PGRContext): { system: string; user: string };
export function getAnalisePriorizarPrompt(ctx: PGRContext): { system: string; user: string };
```

| Slug | Question to LLM | Output |
|---|---|---|
| `geral` | "Resumo executivo do panorama NR-1 da empresa" | ~500 words markdown |
| `psicossocial` | "Foco em fatores psicossociais e violência/assédio" | ~500 words markdown |
| `criticos` | "Liste os 5 riscos mais críticos e justifique" | Numbered list with justification |
| `priorizar` | "Sugira ordenação das 10 ações pendentes mais urgentes" | Prioritized action list |

### 2d. PGR Route — `pgr/[slug]/route.ts`

```typescript
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; slug: string }> }
) {
  // 1. Auth via getB2BUser
  // 2. Validate slug is one of PGR_SLUGS
  // 3. Build context via buildPGRContext(companyId, cycleId)
  // 4. Get prompt via slug-to-function map
  // 5. Call Anthropic (claude-sonnet-4-6, max_tokens: 8192)
  // 6. Receive markdown
  // 7. Render PDF via buildPdf() from existing pdf-helpers.ts with NR-1 variant
  // 8. Upload PDF to Supabase storage ('assessment-pdfs' bucket)
  // 9. Return { markdown, pdfUrl, generatedAt }
}
```

**PDF rendering detail:** Use the existing `buildPdf(formData, reportMarkdown)` from `pdf-helpers.ts`. Pass a minimal `formData` object with company info instead of patient data. The markdown parser in `buildPdf` handles section headers (`## N. Title`), bullets, bold text. The NR-1 variant changes:
- Header title: "BrightMonitor" instead of "BRIGHT PRECISION"
- Subtitle: document title (e.g., "Inventário de Riscos Ocupacionais")
- Footer: "BrightMonitor · NR-1 Compliance" instead of "Bright Precision · IA de Apoio à Decisão Clínica"
- Patient box: Company info (name, CNPJ, cycle dates) instead of patient info

To achieve this without modifying the shared `pdf-helpers.ts` (which Phase 5 doesn't own), create a thin wrapper:

```typescript
function buildNR1Pdf(company: { name: string; cnpj: string }, title: string, markdown: string): Buffer {
  // Use buildPdf with adapted formData shape
  return buildPdf(
    { nome: company.name, nascimento: company.cnpj, publico: title },
    markdown
  );
}
```

This is a pragmatic hack that reuses the existing PDF layout. The "nascimento" field shows CNPJ, and "publico" shows the document title. If the client later demands a custom NR-1 PDF layout, that's a separate effort (PRD §13).

### 2e. Análise IA Route — `analise-ia/[slug]/route.ts`

```typescript
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; slug: string }> }
) {
  // 1. Auth via getB2BUser
  // 2. Validate slug is one of ANALISE_IA_SLUGS
  // 3. Build context via buildPGRContext(companyId, cycleId)
  // 4. Get prompt via slug-to-function map
  // 5. Call Anthropic (claude-sonnet-4-6, max_tokens: 4096)
  // 6. Return { markdown } — no PDF, displayed in-page
}
```

### 2f. Retire `reports/route.ts`

Replace the existing handler with a 410 redirect:

```typescript
export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated. Use /reports/pgr/[slug] or /reports/analise-ia/[slug]' },
    { status: 410 }
  );
}
```

### 2g. TanStack Query Hooks

**useBrightMonitorPGRMutationHook.ts:**

```typescript
export function useBrightMonitorPGRMutation(companyId: string | null) {
  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/brightmonitor/${companyId}/reports/pgr/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('PGR generation failed');
      return res.json() as Promise<{ markdown: string; pdfUrl: string; generatedAt: string }>;
    },
  });
}
```

**useBrightMonitorAnaliseIAQueryHook.ts:**

```typescript
export function useBrightMonitorAnaliseIA(companyId: string | null, slug: string | null) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/brightmonitor/${companyId}/reports/analise-ia/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Analysis generation failed');
      return res.json() as Promise<{ markdown: string }>;
    },
  });
}
```

### 2h. Update `B2BReportsTab.tsx`

Replace the current broken "em construção" buttons with two sections:

**Section 1: Documentos PGR**
- 6 cards, one per PGR document type
- Each card: title, NR-1 reference, "Gerar" button
- On click: trigger PGR mutation, show loading state, then display markdown preview + PDF download link
- Cards: Inventário de Riscos, Plano de Ação 5W2H, Laudo Psicossocial, PGR Completo, Política Anti-Assédio, Ordem de Serviço SST

**Section 2: Análise IA**
- 4 cards/tabs for AI analysis views
- Each card: title, description, "Analisar" button
- On click: trigger Análise IA mutation, display markdown response in-page
- Cards: Panorama Geral, Análise Psicossocial, Riscos Críticos, Priorização de Ações

Both sections show loading spinners during generation. Error states show retry button. Generated content is displayed in a markdown renderer component.

---

## 4. Integration Points

- `build-context.ts` queries `mental_health_evaluations`, `companies`, `assessment_cycles`, `b2b_action_plans`, `b2b_events`, `harassment_reports` using Supabase service-role client
- PGR route imports `buildPdf` from `frontend/app/api/assessment/generate-pdf/pdf-helpers.ts` (existing, not modified by this phase)
- PGR route uses `@anthropic-ai/sdk` (existing dependency)
- Both routes use `getB2BUser` for auth (from `brightmonitor/lib/`)
- `B2BReportsTab` uses the new mutation hooks

## 5. Phase Completion Checklist

- [ ] `build-context.ts` aggregates all PGR data correctly
- [ ] 6 PGR prompt templates created in `pgr-prompts.ts`
- [ ] 4 Análise IA prompt templates created in `analise-prompts.ts`
- [ ] `pgr/[slug]/route.ts` generates markdown + PDF for each slug
- [ ] `analise-ia/[slug]/route.ts` generates markdown for each slug
- [ ] PDF generation works via existing `buildPdf` with NR-1 wrapper
- [ ] PDFs uploaded to Supabase storage with correct content type
- [ ] Old `reports/route.ts` returns 410
- [ ] TanStack hooks created for PGR and Análise IA
- [ ] `B2BReportsTab.tsx` renders PGR cards + Análise IA cards
- [ ] Loading states and error handling in place
- [ ] At least one PGR document generates successfully end-to-end (manual test with real data)

**Next:** `PHASE_6_brightmonitor_nr1_realign_insights_guia.md` — Insights flag wiring + Guia page + polish
