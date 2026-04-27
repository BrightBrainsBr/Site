# BrightMonitor NR-1 — Phase 4: Dashboard Data Adaptation

**Cursor Agent:** /frontend-engineer
**Wave:** 2
**Objective:** Adapt the dashboard API routes (overview, departments, gro, compliance, alerts) to read NR-1 domain scores instead of clinical scale averages. Update the corresponding tab components and interface types. Retire the `domains` route. Wire `bright_insights_enabled` into the dashboard component for tab visibility.
**Depends on:** Phase 0 (routes at `brightmonitor/` paths), Phase 1 (NR-1 DB columns exist)

**Files owned by this phase:**

API routes:
- `frontend/app/api/brightmonitor/[companyId]/overview/route.ts`
- `frontend/app/api/brightmonitor/[companyId]/departments/route.ts`
- `frontend/app/api/brightmonitor/[companyId]/gro/route.ts`
- `frontend/app/api/brightmonitor/[companyId]/compliance/route.ts`
- `frontend/app/api/brightmonitor/[companyId]/alerts/route.ts`
- `frontend/app/api/brightmonitor/[companyId]/domains/route.ts` (retire)
- `frontend/app/api/brightmonitor/lib/riskUtils.ts`

Dashboard frontend:
- `frontend/features/b2b-dashboard/b2b-dashboard.interface.ts`
- `frontend/features/b2b-dashboard/components/B2BDashboardComponent.tsx`
- `frontend/features/b2b-dashboard/components/tabs/B2BOverviewTab.tsx`
- `frontend/features/b2b-dashboard/components/tabs/B2BSetoresTab.tsx`
- `frontend/features/b2b-dashboard/components/tabs/B2BGROTab.tsx`
- `frontend/features/b2b-dashboard/components/tabs/B2BComplianceTab.tsx`

---

## 1. Files to Create

No new files. This phase modifies existing route handlers and tab components.

## 2. What to Build

### 2a. Update `riskUtils.ts` — NR-1 Domain Scoring

The existing `computeNormalizedScore()` and `getRiskLevel()` use a 0-100 wellness scale. NR-1 uses a 1-5 Likert scale with risk bands. Add:

```typescript
export type NR1RiskBand = 'baixo' | 'moderado' | 'alto' | 'critico';

export function getNR1RiskBand(score: number): NR1RiskBand {
  if (score < 2) return 'baixo';
  if (score < 3) return 'moderado';
  if (score < 4) return 'alto';
  return 'critico';
}

export function computeDomainMean(rows: Array<Record<string, unknown>>, column: string): number | null {
  const values = rows.map(r => r[column]).filter((v): v is number => typeof v === 'number');
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}
```

Keep existing clinical score functions — they're still used by the Insights flow.

### 2b. Update `b2b-dashboard.interface.ts` — NR-1 Response Types

Replace clinical scale averages with NR-1 domain scores:

```typescript
export interface B2BOverviewData {
  total: number;
  cycleId: string;
  // NR-1 domain means (1.00-5.00 scale)
  scorePhysical: number | null;
  scoreErgonomic: number | null;
  scorePsychosocial: number | null;
  scoreViolence: number | null;
  scoreOverall: number | null;
  // NR-1 risk distribution (by score_overall band)
  riskDistribution: Record<NR1RiskBand, number>;
  // 8-axis psychosocial (for radar chart)
  psychosocialAxes: {
    workload: number | null; pace: number | null; autonomy: number | null;
    leadership: number | null; relationships: number | null;
    recognition: number | null; clarity: number | null; balance: number | null;
  };
  // Operational KPIs
  pendingActions: number;
  incidentsThisCycle: number;
  harassmentCount: number;
  alertCount: number;
  // Timeline (monthly domain score evolution)
  timeline: B2BOverviewTimeline[];
}

export interface B2BDepartmentData {
  name: string;
  n: number;
  scorePhysical: number | null;
  scoreErgonomic: number | null;
  scorePsychosocial: number | null;
  scoreViolence: number | null;
  scoreOverall: number | null;
  pendingActions: number;
  trend: 'up' | 'down' | 'stable' | null;
}
```

Also add `NR1RiskBand` type and `bright_insights_enabled` to session data.

### 2c. Update `overview/route.ts`

Query `mental_health_evaluations` filtering `assessment_kind = 'nr1'` and compute:

1. **Domain means:** Average `score_physical`, `score_ergonomic`, `score_psychosocial`, `score_violence`, `score_overall` across all rows in cycle.
2. **Risk distribution:** Count rows by `score_overall` band (baixo/moderado/alto/critico).
3. **8-axis psychosocial:** Average each of the 8 psychosocial Likert fields (for radar chart).
4. **Operational KPIs:** Count pending action plans, incidents this cycle, harassment reports this cycle.
5. **Alerts:** Count from `/alerts` logic (inline or separate query).
6. **Timeline:** Group by month, compute monthly `score_overall` mean.

Replace the existing clinical scale aggregation logic entirely.

### 2d. Update `departments/route.ts`

Query grouped by `employee_department`, compute per-department:
- `n` (count of assessments)
- Domain means: `score_physical`, `score_ergonomic`, `score_psychosocial`, `score_violence`, `score_overall`
- `pendingActions` from `b2b_action_plans` where `department = dept`
- `trend`: compare current cycle vs previous cycle (if available)

### 2e. Update `gro/route.ts` — Refocus to NR-1 Risk Inventory

The GRO tab currently shows SRQ-20 distributions and AEP dimensions. Refocus to NR-1:

Return:
```typescript
{
  domainScores: { physical: number, ergonomic: number, psychosocial: number, violence: number },
  psychosocialAxes: Record<string, number>,  // 8-axis
  chemicalExposures: Record<string, number>, // agent → count
  biologicalExposures: Record<string, number>,
  riskMatrix: Array<{ domain: string, probability: string, severity: string, score: number }>,
  incidentCounts: { accidents: number, nearMisses: number, workDiseases: number },
}
```

The risk matrix maps domain scores to probability (from mean) × severity (from incident count / exposure count).

### 2f. Update `compliance/route.ts` — NR-1 Checklist

Replace hardcoded checklist items with computed NR-1 compliance status:

| # | Requirement | Computation |
|---|---|---|
| 1 | PGR contém inventário de riscos | `assessments.count > 0` (NR-1 data exists) |
| 2 | PGR contém plano de ação | `b2b_action_plans.count > 0` |
| 3 | Inventário inclui fatores psicossociais | NR-1 assessments have psychosocial scores |
| 4 | Classificação de riscos com níveis | Domain scores computed (always true if assessments exist) |
| 5 | Plano de ação com prazo e responsável | Action plans with deadline + responsible filled |
| 6 | Documentos datados e assinados | `companies.gro_issued_at IS NOT NULL` |
| 7 | Mecanismo de participação do trabalhador | `harassment_reports.count > 0` OR canal configured |
| 8 | Percepção do trabalhador consultada | NR-1 assessments administered |
| 9 | Análise de acidentes documentada | `b2b_events` with accident types exist |
| 10 | Procedimentos de emergência | Emergency SOPs uploaded |
| 11 | Retenção de dados 20 anos | Static "pendente" |

### 2g. Update `alerts/route.ts`

Generate alerts from NR-1 domain thresholds instead of clinical scale thresholds:

- Department with `score_overall >= 4.0` (critico) → critical alert
- Department with `score_violence >= 3.5` → violence alert
- Individual with `harassment_level = 5` → harassment alert (anonymized: show department only)
- Any `had_accident = true` in current cycle → incident alert

### 2h. Retire `domains/route.ts`

The `B2BDomainsTab` was already removed from the dashboard (absorbed into GRO). The domains endpoint is likely unused. Replace the handler body with a 410 Gone response or delete the file:

```typescript
export async function GET() {
  return NextResponse.json({ error: 'Deprecated — use /gro instead' }, { status: 410 });
}
```

### 2i. Update `B2BDashboardComponent.tsx`

1. Rename the "Eventos & Nexo" tab label to "Incidentes" in `DASHBOARD_TABS`.
2. Add conditional Insights tab: show a "Percepção" or "Insights" tab only when `bright_insights_enabled` is true. Read the flag from the session/company context.
3. Remove the `domains` tab reference if it still exists anywhere.

### 2j. Update Tab Components

**B2BOverviewTab.tsx:**
- 4 KPI cards: Avaliações Realizadas, Score Médio (1-5, with risk band color), Ações Pendentes, Incidentes no Período
- Radar chart: 8-axis psychosocial (workload, pace, autonomy, leadership, relationships, recognition, clarity, balance)
- Bar chart: domain scores (Físico, Ergonômico, Psicossocial, Violência) with risk band color coding
- Inline alerts section (from alerts data)

**B2BSetoresTab.tsx:**
- Per-department table with columns: Setor, Nº Avaliações, Físico, Ergonômico, Psicossocial, Violência, Overall, Ações Pendentes
- Each score cell color-coded by risk band
- Sortable columns

**B2BGROTab.tsx:**
- Domain score summary cards
- Chemical/biological exposure bar charts
- Risk matrix visualization (domain × severity)
- Incident counts

**B2BComplianceTab.tsx:**
- Computed checklist (11 items per 2f)
- Each item: description, NR-1 reference, status (conforme/parcial/pendente)
- Overall compliance percentage

---

## 4. Integration Points

- Routes import `getB2BUser` and `riskUtils` from `../lib/` (relative paths stay valid after Phase 0 move)
- Tab components use existing TanStack Query hooks (updated URLs from Phase 0) — the response shapes change, so TypeScript will flag mismatches that need fixing in the components
- The `B2BDashboardComponent` reads company context from `useB2BSession` — ensure `bright_insights_enabled` is available there

## 5. Phase Completion Checklist

- [ ] `riskUtils.ts` has NR-1 risk band functions
- [ ] `b2b-dashboard.interface.ts` updated with NR-1 response types
- [ ] `overview/route.ts` returns NR-1 domain means + psychosocial axes + operational KPIs
- [ ] `departments/route.ts` returns per-department NR-1 domain scores
- [ ] `gro/route.ts` returns NR-1 risk inventory data (domains, exposures, matrix)
- [ ] `compliance/route.ts` returns computed NR-1 checklist
- [ ] `alerts/route.ts` generates alerts from NR-1 thresholds
- [ ] `domains/route.ts` deprecated (410 response)
- [ ] `B2BDashboardComponent.tsx` tab labels updated + Insights conditional
- [ ] `B2BOverviewTab.tsx` renders NR-1 KPIs + radar + bars
- [ ] `B2BSetoresTab.tsx` renders domain score columns
- [ ] `B2BGROTab.tsx` renders NR-1 risk inventory data
- [ ] `B2BComplianceTab.tsx` renders computed checklist
- [ ] Dashboard loads with real NR-1 data from test submissions

**Next:** `PHASE_5_brightmonitor_nr1_realign_reports.md` — PGR generator + Análise IA panel
