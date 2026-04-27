# BrightMonitor NR-1 — Phase 5: Modified Aggregation APIs

**Cursor Agent:** /backend-engineer
**Wave:** 2 (depends on Phase 1 for schema, Phase 2 for new score keys)
**Objective:** Extend all existing B2B API routes to include SRQ-20 and AEP data in their responses. Rewrite the compliance API to compute real NR-1 status from system data.
**Depends on:** Phase 1 (columns exist), Phase 4 (new tables queried by compliance)

**Files owned by this phase:**
- `frontend/app/api/b2b/lib/riskUtils.ts` (modify)
- `frontend/app/api/b2b/[companyId]/overview/route.ts` (modify)
- `frontend/app/api/b2b/[companyId]/departments/route.ts` (modify)
- `frontend/app/api/b2b/[companyId]/domains/route.ts` (modify)
- `frontend/app/api/b2b/[companyId]/compliance/route.ts` (rewrite)
- `frontend/app/api/b2b/[companyId]/alerts/route.ts` (modify)
- `frontend/app/api/b2b/[companyId]/settings/route.ts` (modify)

---

## 2. What to Build

### `riskUtils.ts`

Add to `SCALE_MAX`:
```typescript
srq20: 20,
aep_total: 56,
aep_pressure: 12,
aep_autonomy: 8,
aep_breaks: 8,
aep_relationships: 12,
aep_cognitive: 8,
aep_environment: 8,
```

Add to `DOMAIN_KEYS`: `'srq20'`, `'aep_total'`

Add NR-1 specific risk classification:
```typescript
function getSRQ20RiskLevel(score: number): RiskLevel
  // <8 = low, 8-11 = moderate, 12-16 = elevated, 17+ = critical

function getAEPRiskLevel(score: number): RiskLevel
  // 0-14 = low, 15-28 = moderate, 29-42 = elevated, 43+ = critical
```

### `overview/route.ts`

Extend response with:
- `srq20Avg: number | null` — average SRQ-20 score across evaluations
- `aepAvg: number | null` — average AEP total score
- `alertCount: number` — count of alerts (evaluations with normalized score < 60)
- `timeline: Array<{ month: string, baixo: number, moderado: number, elevado: number, critico: number }>` — monthly risk distribution percentages for the cycle period

The timeline data requires grouping evaluations by month (`created_at`) and computing risk distribution per month.

### `departments/route.ts`

Extend each department object with per-instrument averages:
```typescript
{
  ...existing,
  phq9Avg: number | null,
  gad7Avg: number | null,
  srq20Avg: number | null,
  aepAvg: number | null,
  pendingActions: number  // count from b2b_action_plans where department matches and status != 'concluido'
}
```

### `domains/route.ts`

Add SRQ-20 and AEP as domains in the domain list. They follow the same pattern: average score across evaluations that have the key in `scores` jsonb.

### `compliance/route.ts` — FULL REWRITE

Delete all existing hardcoded data. Query multiple tables to compute 17-item checklist:

```typescript
interface ComplianceItem {
  id: number
  ref: string          // e.g. "1.5.7.1.a"
  description: string
  status: 'conforme' | 'parcial' | 'pendente'
  detail: string       // computed explanation
}
```

Each item's status is computed from real data — see PRD Section 9 for the full 17-item computation logic.

Response:
```typescript
{
  items: ComplianceItem[],
  conformeCount: number,
  totalCount: number,
  groIssuedAt: string | null,
  groValidUntil: string | null,
}
```

### `alerts/route.ts`

Extend alert criteria to include:
- SRQ-20 ≥ 8 (positive screening for mental health disorders)
- AEP dimensions individually elevated
- Add `srq20Score` and `aepScore` to each alert's `domainScores`

### `settings/route.ts`

Extend POST actions to handle NR-1 field updates:
- Action `update_nr1_fields`: update `companies` with `nr1_process_descriptions`, `nr1_activities`, `nr1_preventive_measures`, `sst_responsible_name`, `sst_responsible_role`, `sst_signature_url`, `cnae`, `risk_grade`

Extend GET to include NR-1 fields in company data response.

## 3. Phase Completion Checklist

- [ ] Modified: `riskUtils.ts` with SRQ-20, AEP scales + risk functions
- [ ] Modified: `overview/route.ts` with srq20Avg, aepAvg, alertCount, timeline
- [ ] Modified: `departments/route.ts` with per-instrument averages + pendingActions
- [ ] Modified: `domains/route.ts` with SRQ-20 and AEP domains
- [ ] Rewritten: `compliance/route.ts` with 17-item computed checklist
- [ ] Modified: `alerts/route.ts` with SRQ-20/AEP thresholds
- [ ] Modified: `settings/route.ts` with NR-1 field CRUD
- [ ] All existing dashboard tabs still work with updated API responses

**Next:** `PHASE_6_nr1_dashboard_shell_rewrites.md` — Dashboard shell + existing tab rewrites
