# Bright Precision B2B Company Dashboard — Phase 4: B2B Dashboard Frontend

**Cursor Agent:** /frontend-engineer
**Wave:** 2
**Objective:** Build the full B2B dashboard UI — header, cycle selector, KPI row, and 5 tabs (Visão Geral, Mapa de Risco, Domínios Cognitivos, Conformidade NR-1, Alertas).
**Depends on:** Phase 2 (empresa layout, login), Phase 3 (aggregation APIs)

**Files owned by this phase:**
- `frontend/features/b2b-dashboard/b2b-dashboard.interface.ts` (create)
- `frontend/features/b2b-dashboard/components/B2BDashboardComponent.tsx` (create)
- `frontend/features/b2b-dashboard/components/B2BHeaderComponent.tsx` (create)
- `frontend/features/b2b-dashboard/components/B2BKpiRowComponent.tsx` (create)
- `frontend/features/b2b-dashboard/components/tabs/B2BOverviewTab.tsx` (create)
- `frontend/features/b2b-dashboard/components/tabs/B2BRiskMapTab.tsx` (create)
- `frontend/features/b2b-dashboard/components/tabs/B2BDomainsTab.tsx` (create)
- `frontend/features/b2b-dashboard/components/tabs/B2BComplianceTab.tsx` (create)
- `frontend/features/b2b-dashboard/components/tabs/B2BAlertsTab.tsx` (create)
- `frontend/features/b2b-dashboard/hooks/useB2BSession.ts` (create)
- `frontend/features/b2b-dashboard/hooks/useB2BOverview.ts` (create)
- `frontend/features/b2b-dashboard/hooks/useB2BDepartments.ts` (create)
- `frontend/features/b2b-dashboard/hooks/useB2BDomains.ts` (create)
- `frontend/features/b2b-dashboard/hooks/useB2BCompliance.ts` (create)
- `frontend/features/b2b-dashboard/hooks/useB2BAlerts.ts` (create)
- `frontend/app/[locale]/empresa/dashboard/page.tsx` (modify)

---

## 1. Files to Create

```
frontend/
├── features/b2b-dashboard/
│   ├── b2b-dashboard.interface.ts
│   ├── components/
│   │   ├── B2BDashboardComponent.tsx
│   │   ├── B2BHeaderComponent.tsx
│   │   ├── B2BKpiRowComponent.tsx
│   │   └── tabs/
│   │       ├── B2BOverviewTab.tsx
│   │       ├── B2BRiskMapTab.tsx
│   │       ├── B2BDomainsTab.tsx
│   │       ├── B2BComplianceTab.tsx
│   │       └── B2BAlertsTab.tsx
│   └── hooks/
│       ├── useB2BSession.ts
│       ├── useB2BOverview.ts
│       ├── useB2BDepartments.ts
│       ├── useB2BDomains.ts
│       ├── useB2BCompliance.ts
│       └── useB2BAlerts.ts
└── app/[locale]/empresa/dashboard/page.tsx  # MODIFY
```

---

## 2. What to Build

### 2.1 `frontend/features/b2b-dashboard/b2b-dashboard.interface.ts`

**Purpose:** TypeScript types for all B2B API responses and component props.

**Key types:**
- `B2BOverview`, `B2BRiskDistribution`, `B2BDepartment`, `B2BDomain`, `B2BCompliance`, `B2BAlert`
- Match API response shapes from Phase 3.

### 2.2 `frontend/features/b2b-dashboard/hooks/useB2BSession.ts`

**Purpose:** Session + company_id + cycle resolution.

**Returns:** `{ companyId, currentCycleId, setCycleId, cycles, isLoading }`. Uses `useB2BCompanyUser` and nuqs or useState for cycle selection.

### 2.3 `frontend/features/b2b-dashboard/hooks/useB2BOverview.ts`, etc.

**Purpose:** TanStack Query hooks for each API.

**Pattern:**
```ts
export function useB2BOverview(companyId: string, cycleId: string | null) {
  return useQuery({
    queryKey: ['b2b', 'overview', companyId, cycleId],
    queryFn: () => fetch(`/api/b2b/${companyId}/overview?cycle=${cycleId}`).then(r => r.json()),
    enabled: !!companyId && !!cycleId,
  });
}
```

Same for useB2BDepartments, useB2BDomains, useB2BCompliance, useB2BAlerts.

### 2.4 `frontend/features/b2b-dashboard/components/B2BHeaderComponent.tsx`

**Purpose:** Company name, cycle selector dropdown, NR-1 badge.

**Props:** `companyName`, `cycles`, `currentCycle`, `onCycleChange`, `complianceStatus?` (optional for badge).

### 2.5 `frontend/features/b2b-dashboard/components/B2BKpiRowComponent.tsx`

**Purpose:** 5 KPI cards in a row.

**Props:** `kpis: { total, avgScore, critical, elevated, moderate, low }` (or similar from overview).

### 2.6 `frontend/features/b2b-dashboard/components/B2BDashboardComponent.tsx`

**Purpose:** Tab router + header + KPI row.

**Logic:**
- Tab state via nuqs (`?tab=overview|risk|domains|compliance|alerts`) or useState.
- Render B2BHeaderComponent, B2BKpiRowComponent (data from useB2BOverview), tab nav, and active tab content.
- Pass companyId and cycleId to all child components.

### 2.7 Tab Components

| Tab | Purpose | Data Source | UI |
|-----|---------|-------------|-----|
| B2BOverviewTab | Visão Geral | useB2BOverview | Trend chart (if data allows), donut for risk dist, dept risk bars |
| B2BRiskMapTab | Mapa de Risco | useB2BDepartments | Dept table, hierarchy/bar chart |
| B2BDomainsTab | Domínios Cognitivos | useB2BDomains | Bar chart for 13 domains, highlight critical/strong |
| B2BComplianceTab | Conformidade NR-1 | useB2BCompliance | Checklist, GRO status cards, coverage % |
| B2BAlertsTab | Alertas & Prioridades | useB2BAlerts | Risk cards with COL-XXXX, LGPD disclaimer |

**Chart library:** Use Chart.js, recharts, or existing project chart lib. Match prototype at `claude_artifact/new_products/2.1_b2b_dashboard/bright_precision_dashboard.html`.

### 2.8 `frontend/app/[locale]/empresa/dashboard/page.tsx`

**Modify:** Render `B2BDashboardComponent` with companyId from `useB2BCompanyUser`. Pass through layout.

---

## 3. Database Migration

None.

---

## 4. Integration Points

| File | Change |
|------|--------|
| `frontend/app/[locale]/empresa/dashboard/page.tsx` | Import and render B2BDashboardComponent |
| `frontend/features/b2b-dashboard/components/B2BLoginComponent.tsx` | Already created in Phase 2. No change. |

---

## 5. Phase Completion Checklist

- [ ] b2b-dashboard.interface.ts with all types
- [ ] useB2BSession, useB2BOverview, useB2BDepartments, useB2BDomains, useB2BCompliance, useB2BAlerts hooks
- [ ] B2BHeaderComponent with cycle selector
- [ ] B2BKpiRowComponent with 5 KPIs
- [ ] B2BDashboardComponent with tab nav
- [ ] All 5 tab components render with charts/tables
- [ ] dashboard page renders full dashboard
- [ ] Cycle switch updates all tabs
- [ ] Dark theme consistent with portal/avaliacao

**Next:** `PHASE_5a_b2b_dashboard_admin_backend.md` — Portal companies API routes
