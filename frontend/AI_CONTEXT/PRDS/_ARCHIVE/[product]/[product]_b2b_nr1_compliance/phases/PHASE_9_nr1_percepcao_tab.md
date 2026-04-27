# BrightMonitor NR-1 — Phase 9: Percepção Organizacional (Dashboard Integration)

**Cursor Agent:** /frontend-engineer
**Wave:** 3 (parallel with Phase 8)
**Objective:** The Percepção Organizacional tab was removed from the main 7 tabs (per call: "a lot of the advanced features aren't gonna be built"). Instead, integrate percepcao data as a section within the GRO tab and as correlation insights in the Events tab. This phase wires the percepcao data into existing tabs.
**Depends on:** Phase 4 (percepcao API), Phase 7 (GRO and Events tabs exist)

**Files owned by this phase:**
- `frontend/features/b2b-dashboard/components/tabs/B2BGROTab.tsx` (modify — add percepcao section)
- `frontend/features/b2b-dashboard/components/tabs/B2BEventsTab.tsx` (modify — add percepcao correlation)

---

## 2. What to Build

### GRO Tab — Percepcao Section

Add a new section at the bottom of `B2BGROTab.tsx`:

**"Percepção dos Colaboradores"** section:
- 4 mini KPI cards: Total Respostas, Urgência Alta, Setor com Mais Sinais, Anonimato 100%
- Donut chart: distribution by factor type (Estresse, Sobrecarga, Assédio, Conflito, Condições, Outro)
- Data from `useB2BPercepcaoQueryHook`

This replaces what was going to be a standalone "Percepção Organizacional" or "Canal Anônimo" tab. The data comes from the Canal de Percepção step in the B2B assessment form and AEP Q15 responses.

### Events Tab — Correlation Insights

Add a "Correlações" card at the bottom of `B2BEventsTab.tsx`:

- Show correlations from the percepcao API response
- Each correlation: severity badge (alta/media) + description text
- Example: "4 percepções de pressão/estresse coincidem com AEP 'Pressão por Metas' elevado nos mesmos setores"

This provides the cross-referencing insight without a dedicated tab.

## 3. Phase Completion Checklist

- [ ] Modified: `B2BGROTab.tsx` with percepcao section (KPIs + donut)
- [ ] Modified: `B2BEventsTab.tsx` with correlation insights card
- [ ] Percepcao data displays correctly from form responses
- [ ] No standalone Percepcao tab needed

**This is the final phase.** After all 9 phases are complete:
- B2B assessment form collects SRQ-20 + AEP + Canal + Consents
- Laudo Individual PDF is generated per employee via AI
- 7-tab dashboard shows all data from real database fields
- Action plans and events have full CRUD
- NR-1 inventory can be generated
- PDF upload with AI extraction works for company data and bulk events
- Compliance status is computed from real system state
- Employee tracking shows onboarding progress
- Reusable filter bar works across all tabs and reports
