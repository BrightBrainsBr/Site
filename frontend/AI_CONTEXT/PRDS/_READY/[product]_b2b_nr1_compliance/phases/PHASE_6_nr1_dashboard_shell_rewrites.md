# BrightMonitor NR-1 — Phase 6: Dashboard Shell + Tab Rewrites

**Cursor Agent:** /frontend-engineer
**Wave:** 2 (parallel with Phase 7)
**Objective:** Rewrite the dashboard shell to the new 7-tab structure. Rewrite Overview, Setores, and Compliance tabs. Create the reusable filter bar and employee tracking components.
**Depends on:** Phase 5 (modified API responses)

**Files owned by this phase:**
- `frontend/features/b2b-dashboard/components/B2BDashboardComponent.tsx` (modify)
- `frontend/features/b2b-dashboard/components/tabs/B2BOverviewTab.tsx` (rewrite)
- `frontend/features/b2b-dashboard/components/tabs/B2BSetoresTab.tsx` (new, replaces B2BRiskMapTab)
- `frontend/features/b2b-dashboard/components/tabs/B2BComplianceTab.tsx` (rewrite)
- `frontend/features/b2b-dashboard/components/shared/B2BFilterBarComponent.tsx` (new)
- `frontend/features/b2b-dashboard/components/shared/B2BEmployeeTrackingComponent.tsx` (new)
- `frontend/features/b2b-dashboard/b2b-dashboard.interface.ts` (modify)
- `frontend/features/b2b-dashboard/constants/domain-mapping.ts` (modify)
- `frontend/features/b2b-dashboard/hooks/useB2BOverview.ts` (modify)
- `frontend/features/b2b-dashboard/hooks/useB2BDepartments.ts` (modify)
- `frontend/features/b2b-dashboard/hooks/useB2BCompliance.ts` (modify)
- `frontend/features/b2b-dashboard/hooks/useB2BEmployeeTrackingQueryHook.ts` (new)

---

## 2. What to Build

### `B2BDashboardComponent.tsx` — Shell Rewrite

New tab structure (replaces current 7 tabs):
```typescript
const TABS = [
  { id: 'visao-geral', label: 'Visão Geral', icon: ChartIcon },
  { id: 'setores', label: 'Setores', icon: BuildingIcon },
  { id: 'gro', label: 'GRO Psicossocial', icon: ScaleIcon },
  { id: 'plano-acao', label: 'Plano de Ação', icon: RefreshIcon },
  { id: 'eventos', label: 'Eventos & Nexo', icon: AlertIcon },
  { id: 'compliance', label: 'Compliance NR-1', icon: CheckIcon },
  { id: 'relatorios', label: 'Relatórios', icon: FileIcon },
]
```

Settings tab is NOT in the main tab bar — it's accessed via the header settings icon (existing pattern).

**Onboarding gate:** Before rendering tabs, check `useB2BEmployeeTrackingQueryHook`:
- If `completionPct < 30%` → show `B2BEmployeeTrackingComponent` instead of dashboard tabs
- Once threshold met, tabs are visible

Tab state in URL via `nuqs` (shareable, persists on refresh).

### `B2BOverviewTab.tsx` — Rewrite

Match the design from `BrightMonitor_Dashboard_NR1 (1).html` TabVisaoGeral.

Sections:
1. **KPI strip**: 5 cards — Total Avaliados, Risco Baixo, Moderado, Elevado, Crítico. Each shows count + percentage. Color-coded borders.
2. **Two-column charts**: Left = donut (risk distribution), Right = stacked bar (monthly evolution from `timeline` data)
3. **Alerts section**: Red-bordered card with alert list from `useB2BAlerts`. Each alert: risk dot + text + urgency badge.

All data from `useB2BOverview` (extended) and `useB2BAlerts`.

### `B2BSetoresTab.tsx` — New (replaces B2BRiskMapTab)

Sortable table matching `BrightMonitor_Dashboard_NR1 (1).html` TabSetores.

- Sort buttons above table: Score Global, PHQ-9, GAD-7, SRQ-20, AEP, Ações Pendentes
- Table columns: Setor, Colabs, Risco (badge), Score, PHQ-9, GAD-7, SRQ-20, AEP/56, Ações
- Color-coded score values (green/yellow/orange/red based on thresholds)
- `B2BFilterBarComponent` integration for department filtering

Data from `useB2BDepartments` (extended response).

Delete `B2BRiskMapTab.tsx` — no longer needed.

### `B2BComplianceTab.tsx` — Rewrite

Delete all hardcoded `CHECKLIST_ITEMS`, `TIMELINE_ITEMS`, `LEGAL_DOCS`.

Sections:
1. **Score header**: X/17 conformes, large number + progress bar
2. **Checklist**: 17 items from API, each showing: NR-1 ref code, description, computed detail, status badge (conforme=green, parcial=yellow, pendente=red)

All data from `useB2BCompliance` (rewritten API).

### `B2BFilterBarComponent.tsx` — New Shared Component

Reusable across all tabs. Props:
```typescript
interface FilterBarProps {
  availableDepartments: string[]
  showRiskFilter?: boolean
  showDateFilter?: boolean
  showInstrumentFilter?: boolean
  onFiltersChange: (filters: DashboardFilters) => void
}
```

Filter state stored in URL via `nuqs`:
- `dept`: comma-separated department names
- `risk`: comma-separated risk levels
- `from`, `to`: ISO date strings
- `instrument`: scale key

Compact pill-based UI. Collapsible on mobile. Clear all button.

### `B2BEmployeeTrackingComponent.tsx` — New Shared Component

Shown when company completion is below threshold.

Sections:
1. Overall progress bar: "X de Y funcionários completaram (Z%)"
2. Per-department progress bars
3. Employee table: email (partially masked), department, status badge (Pendente/Iniciou/Completou)
4. Action buttons: "Enviar lembrete" (future, disabled for now), "Exportar pendentes (CSV)"

Data from `useB2BEmployeeTrackingQueryHook`.

### Interface + Hook Updates

**`b2b-dashboard.interface.ts`**: Add types for:
- `B2BOverviewTimeline` (month, risk counts)
- `B2BComplianceItem` (id, ref, description, status, detail)
- `B2BEmployeeTrackingData`
- `DashboardFilters` (departments, riskLevels, dateFrom, dateTo, instrument)

**`domain-mapping.ts`**: Add:
- `srq20` → "SRQ-20 (OMS)", max 20
- `aep_total` → "AEP Global", max 56

**Hooks**: Update response types to match modified API shapes.

## 3. Phase Completion Checklist

- [ ] Modified: `B2BDashboardComponent.tsx` with new 7-tab structure + onboarding gate
- [ ] Rewritten: `B2BOverviewTab.tsx` with KPI strip, charts, inline alerts
- [ ] Created: `B2BSetoresTab.tsx` with sortable instrument columns
- [ ] Rewritten: `B2BComplianceTab.tsx` with 17-item computed checklist
- [ ] Created: `B2BFilterBarComponent.tsx` with nuqs URL state
- [ ] Created: `B2BEmployeeTrackingComponent.tsx` with onboarding view
- [ ] Created: `useB2BEmployeeTrackingQueryHook.ts`
- [ ] Modified: interfaces, hooks, domain mapping for new data shapes
- [ ] Deleted: `B2BAlertsTab.tsx` (alerts in overview)
- [ ] Deleted: `B2BDomainsTab.tsx` (domains in GRO)
- [ ] Deleted: `B2BRiskMapTab.tsx` (replaced by Setores)
- [ ] No hardcoded data remains in any tab

**Next:** `PHASE_7_nr1_new_dashboard_tabs.md` — GRO, Action Plans, Events, Reports tabs
