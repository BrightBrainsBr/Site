# BrightMonitor NR-1 — Phase 6: Insights Flag + Guia Page + Polish

**Cursor Agent:** /frontend-engineer
**Wave:** 4
**Objective:** Wire the `bright_insights_enabled` flag into Settings (admin toggle), repurpose the Percepção tab as the Insights surface (visible only when flag is true), create the static Guia methodology page, and perform a final smoke test.
**Depends on:** Phase 0 (routes at `brightmonitor/`), Phase 1 (DB has `bright_insights_enabled`)

**Files owned by this phase:**
- `frontend/app/api/brightmonitor/[companyId]/settings/route.ts`
- `frontend/app/api/brightmonitor/[companyId]/percepcao/route.ts`
- `frontend/features/b2b-dashboard/components/tabs/B2BSettingsTab.tsx`
- `frontend/features/b2b-dashboard/components/tabs/B2BPercepcaoTab.tsx`
- `frontend/app/[locale]/brightmonitor/guia/page.tsx` (new)

---

## 1. Files to Create

```
frontend/app/[locale]/brightmonitor/
└── guia/
    └── page.tsx                      # Static methodology page
```

## 2. What to Build

### 2a. Update `settings/route.ts` — Expose Insights Toggle

The settings route currently handles company settings (NR-1 fields, SST responsible, etc.). Add support for reading and writing `bright_insights_enabled`:

**GET response** — include in the returned settings object:
```typescript
bright_insights_enabled: company.bright_insights_enabled
```

**POST/PATCH handler** — accept and persist:
```typescript
if (body.bright_insights_enabled !== undefined) {
  updatePayload.bright_insights_enabled = body.bright_insights_enabled;
}
```

Only Bright Brains portal admins should toggle this flag (not company admins). Add a role check:

```typescript
// Only portal admins can change the Insights flag
if (body.bright_insights_enabled !== undefined && auth.role !== 'portal-admin') {
  return NextResponse.json({ error: 'Only Bright Brains admins can toggle Insights' }, { status: 403 });
}
```

If the existing auth pattern doesn't distinguish portal-admin from company-admin, use a simpler approach: the toggle is visible in the settings UI but only works when accessed from the portal admin view (`/portal/empresas/[id]`). The `getB2BUser` auth function already knows the user's role.

### 2b. Update `B2BSettingsTab.tsx` — Insights Toggle UI

Add a section to the Settings tab for the Insights flag:

```
┌─────────────────────────────────────────────────────┐
│ Bright Insights                                      │
│                                                       │
│ Habilitar módulo Bright Insights para esta empresa.  │
│ Quando ativado, a avaliação incluirá escalas          │
│ clínicas (PHQ-9, GAD-7, ISI, MBI) e o dashboard      │
│ mostrará a aba Insights.                              │
│                                                       │
│ [Toggle: ON/OFF]    Status: Desativado                │
│                                                       │
│ ⚠️ Somente administradores Bright Brains podem       │
│    alterar esta configuração.                         │
└─────────────────────────────────────────────────────┘
```

Use the existing settings mutation hook to persist the change. The toggle should be disabled (grayed out) if the current user is a company admin (not portal admin).

### 2c. Update `percepcao/route.ts` — Repurpose for Insights

Currently returns Canal de Percepção data from `b2b_percepcao_reports`. Repurpose:

**When `bright_insights_enabled = false`:**
- Return empty response or redirect to overview. The Percepção tab won't be visible anyway.

**When `bright_insights_enabled = true`:**
- Return Insights-relevant data: clinical scale averages (PHQ-9, GAD-7, ISI, MBI) from `mental_health_evaluations` where `assessment_kind = 'insights'` (or where clinical scale columns are populated).
- Response shape:

```typescript
{
  enabled: true;
  scaleAverages: {
    phq9: number | null;
    gad7: number | null;
    isi: number | null;
    mbi: number | null;
  };
  scaleDistributions: Record<string, Record<string, number>>;  // scale → risk_level → count
  assessmentCount: number;
  cycleId: string;
}
```

### 2d. Update `B2BPercepcaoTab.tsx` — Insights Surface

Repurpose the existing Percepção tab component as the Insights module surface:

- Show clinical scale averages as KPI cards
- Show risk distribution donut chart per scale
- Show per-department clinical scale breakdown (if data available)
- Include a notice: "Bright Insights — Módulo de Saúde Mental"

If `bright_insights_enabled` is false, this component won't render (the tab is hidden in `B2BDashboardComponent` per Phase 4's work). But add a guard anyway:

```typescript
if (!insightsEnabled) {
  return <div>Módulo Bright Insights não está habilitado para esta empresa.</div>;
}
```

### 2e. Guia Page — Static Methodology Content

Create `frontend/app/[locale]/brightmonitor/guia/page.tsx` as a static Next.js page:

1. Copy the HTML content from `claude_artifact/teste-monitor-brightbrains/guia.html`
2. Convert to React JSX with Tailwind styling
3. Wrap in the existing app layout (use the same shell as other pages)
4. Content sections (from Bernardo's Guia):
   - O que é a NR-1
   - Como funciona a avaliação
   - Metodologia de classificação de riscos
   - Domínios avaliados (7 risk domains)
   - Como interpretar os resultados
   - Glossário de termos NR-1
   - Referências legais

This is a **wholesale content copy** for the pilot. No dynamic data, no API calls. Pure static content page.

The page should be accessible from the dashboard navigation. Add a "Guia" link/button in the dashboard sidebar or top nav. This requires a small addition to `B2BDashboardComponent.tsx` — but that file is owned by Phase 4.

**Resolution:** Phase 4 already adds the tab structure. Add the Guia as an external link (opens in new tab) rather than an in-dashboard tab. This avoids modifying `B2BDashboardComponent.tsx` in this phase:

```typescript
// In B2BSettingsTab or a footer link:
<a href="/pt-BR/brightmonitor/guia" target="_blank" rel="noopener noreferrer">
  📖 Guia de Metodologia NR-1
</a>
```

Or, if Phase 4 already included a placeholder "Guia" tab/link, this phase just creates the destination page.

### 2f. Smoke Test Checklist

After all phases, verify the complete flow:

1. **Form flow:** Employee enters via company code → sees NR-1 steps → fills all 9 steps → submits
2. **Data persistence:** Check `mental_health_evaluations` row has NR-1 columns populated
3. **Dashboard:** Admin logs in → Overview shows NR-1 KPIs and radar → Setores shows domain columns
4. **Reports:** Click "Gerar PGR Completo" → Claude generates markdown → PDF downloads → content has NR-1 sections
5. **Análise IA:** Click "Panorama Geral" → markdown renders in page
6. **Insights toggle:** Portal admin enables Insights → form shows additional PHQ-9/GAD-7 steps → Insights tab appears
7. **Guia:** Navigate to `/brightmonitor/guia` → static content renders

---

## 4. Integration Points

- `settings/route.ts` reads/writes `companies.bright_insights_enabled`
- `percepcao/route.ts` reads from `mental_health_evaluations` (clinical scale columns)
- `B2BPercepcaoTab.tsx` uses existing `useB2BPercepcaoQueryHook` (updated URL from Phase 0)
- Guia page uses the app layout from `frontend/app/[locale]/layout.tsx`

## 5. Phase Completion Checklist

- [ ] `settings/route.ts` exposes `bright_insights_enabled` in GET and accepts it in POST
- [ ] Portal admin role check on Insights toggle
- [ ] `B2BSettingsTab.tsx` shows Insights toggle section
- [ ] `percepcao/route.ts` returns Insights data when flag is true
- [ ] `B2BPercepcaoTab.tsx` repurposed as Insights surface
- [ ] `guia/page.tsx` created with static NR-1 methodology content
- [ ] Guia page accessible via link from dashboard
- [ ] `npm run build` passes
- [ ] Smoke test: form → submit → dashboard → reports → PDF (end-to-end)

**End of implementation phases.** QA runs automatically via CTO orchestration (`/frontend-qa`).
