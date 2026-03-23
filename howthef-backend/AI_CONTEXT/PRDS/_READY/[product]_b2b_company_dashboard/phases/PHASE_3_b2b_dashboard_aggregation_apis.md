# Bright Precision B2B Company Dashboard — Phase 3: B2B Aggregation APIs

**Cursor Agent:** /backend-engineer
**Wave:** 2
**Objective:** Create the 5 B2B dashboard API endpoints (overview, departments, domains, compliance, alerts) with company ownership verification and cycle filtering.
**Depends on:** Phase 0, Phase 2 (GET /api/b2b/me exists)

**Files owned by this phase:**
- `frontend/app/api/b2b/[companyId]/overview/route.ts` (create)
- `frontend/app/api/b2b/[companyId]/departments/route.ts` (create)
- `frontend/app/api/b2b/[companyId]/domains/route.ts` (create)
- `frontend/app/api/b2b/[companyId]/compliance/route.ts` (create)
- `frontend/app/api/b2b/[companyId]/alerts/route.ts` (create)
- `frontend/app/api/b2b/lib/getB2BUser.ts` (create — shared helper)

---

## 1. Files to Create

```
frontend/app/api/b2b/
├── lib/
│   └── getB2BUser.ts                    # CREATE — shared auth helper
└── [companyId]/
    ├── overview/route.ts                # CREATE
    ├── departments/route.ts             # CREATE
    ├── domains/route.ts                 # CREATE
    ├── compliance/route.ts              # CREATE
    └── alerts/route.ts                  # CREATE
```

---

## 2. What to Build

### 2.1 `frontend/app/api/b2b/lib/getB2BUser.ts`

**Purpose:** Shared helper to verify JWT and company ownership.

**Signature:**
```ts
export async function getB2BUser(request: NextRequest, companyId: string): Promise<
  | { ok: true; companyId: string; userId: string }
  | { ok: false; status: number; body: object }
>
```

**Logic:**
1. Get Supabase client (server, with cookies or Authorization header).
2. `getUser()`. If no user → return `{ ok: false, status: 401, body: { error: 'Unauthorized' } }`.
3. Query `company_users` WHERE `user_id = user.id` AND `company_id = companyId`.
4. If not found → return `{ ok: false, status: 403, body: { error: 'Forbidden' } }`.
5. Return `{ ok: true, companyId, userId }`.

### 2.2 `frontend/app/api/b2b/[companyId]/overview/route.ts`

**Purpose:** KPIs for a company in a given cycle.

**Query params:** `cycle` (uuid, optional — default to current cycle).

**Logic:**
1. `getB2BUser(request, companyId)`. If !ok, return NextResponse.json(body, status).
2. Resolve cycle: if `cycle` param, use it; else get current cycle for company.
3. Query `mental_health_evaluations` WHERE `company_id = companyId` AND `cycle_id = cycleId`.
4. Aggregate:
   - `total`: count
   - `avgScore`: average of overall score (from `scores` jsonb — use the main composite score field)
   - `riskDistribution`: { critical: n, elevated: n, moderate: n, low: n } — classify by score thresholds (< 45, 45–59, 60–69, ≥ 70)
   - `burnoutIndex`: average of `scores.mbi` if present
5. Return JSON.

### 2.3 `frontend/app/api/b2b/[companyId]/departments/route.ts`

**Purpose:** Per-department breakdown with trend vs previous cycle.

**Query params:** `cycle` (optional).

**Logic:**
1. `getB2BUser`. Resolve cycle.
2. Get previous cycle for company (same company, `ends_at < current.starts_at` ORDER BY ends_at DESC LIMIT 1).
3. Query evaluations for current cycle. Group by `employee_department`.
4. Per department: `name`, `n`, `avgScore`, `riskBreakdown`, `trend` (compare to previous cycle if available).
5. Return `{ departments: [...] }`.

### 2.4 `frontend/app/api/b2b/[companyId]/domains/route.ts`

**Purpose:** 13 cognitive domain averages from `scores` jsonb.

**Query params:** `cycle` (optional).

**Logic:**
1. `getB2BUser`. Resolve cycle.
2. Query evaluations. Extract domain scores from `scores` (structure per existing assessment — e.g. 13 keys).
3. Compute average per domain. Return `{ domains: [{ name, avg }] }`.
4. No external benchmark in MVP — do not add benchmark field or use "–".

### 2.5 `frontend/app/api/b2b/[companyId]/compliance/route.ts`

**Purpose:** NR-1 compliance status.

**Query params:** `cycle` (optional).

**Logic:**
1. `getB2BUser`. Resolve cycle.
2. Get company: `companies` WHERE id = companyId. Select `gro_issued_at`, `gro_valid_until`.
3. Query evaluations: count total, count WHERE `reviewer_status = 'approved'`.
4. `coveragePct` = approved / total * 100 (or 0 if total = 0).
5. Return `{ groIssuedAt, groValidUntil, totalEvaluations, approvedCount, coveragePct, cycle }`.

### 2.6 `frontend/app/api/b2b/[companyId]/alerts/route.ts`

**Purpose:** Anonymized high/critical risk employees.

**Query params:** `cycle` (optional).

**Logic:**
1. `getB2BUser`. Resolve cycle.
2. Query evaluations WHERE score < 60 (elevated + critical). Select `id`, `scores`, `employee_department`.
3. For each: compute `COL-{4-digit hash of id}`. Never return `patient_name`, `patient_email`, `patient_cpf`, or raw `id`.
4. Return `{ alerts: [{ id: 'COL-XXXX', riskLevel, department, domainScores? }] }`.

**Anonymization:** `COL-` + last 4 chars of a deterministic hash of evaluation uuid (e.g. `crypto.createHash('sha256').update(id).digest('hex').slice(-4)`).

---

## 3. Database Migration

None.

---

## 4. Integration Points

| File | Change |
|------|--------|
| `frontend/app/api/b2b/me/route.ts` | None. This phase creates new routes. |

---

## 5. Phase Completion Checklist

- [ ] getB2BUser helper created and used by all 5 routes
- [ ] overview returns total, avgScore, riskDistribution, burnoutIndex
- [ ] departments returns per-dept breakdown with trend
- [ ] domains returns 13 domain averages
- [ ] compliance returns GRO status, coverage
- [ ] alerts returns anonymized COL-XXXX entries, no PII
- [ ] All routes support ?cycle= param and default to current cycle
- [ ] 401/403 returned when auth fails or company mismatch

**Next:** `PHASE_4_b2b_dashboard_frontend.md` — Full dashboard UI with 5 tabs
