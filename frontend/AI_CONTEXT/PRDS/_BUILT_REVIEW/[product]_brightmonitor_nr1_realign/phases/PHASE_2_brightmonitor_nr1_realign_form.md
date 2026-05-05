# BrightMonitor NR-1 — Phase 2: NR-1 Assessment Form

**Cursor Agent:** /frontend-engineer
**Wave:** 1
**Objective:** Replace the B2B assessment form's clinical battery with the correct NR-1 risk-domain form: 8 new step components (Perfil through Percepção), NR-1 scoring helpers, updated form data interface, and `AssessmentPage` branching on `bright_insights_enabled`.
**Depends on:** Phase 1 (DB columns exist for NR-1 fields)

**Files owned by this phase:**
- `frontend/features/assessment/components/steps/nr1/PerfilStep.tsx` (new)
- `frontend/features/assessment/components/steps/nr1/FisicoStep.tsx` (new)
- `frontend/features/assessment/components/steps/nr1/QuimicoStep.tsx` (new)
- `frontend/features/assessment/components/steps/nr1/BiologicoStep.tsx` (new)
- `frontend/features/assessment/components/steps/nr1/ErgonomicoStep.tsx` (new)
- `frontend/features/assessment/components/steps/nr1/PsicossocialStep.tsx` (new)
- `frontend/features/assessment/components/steps/nr1/AcidentesStep.tsx` (new)
- `frontend/features/assessment/components/steps/nr1/PercepcaoNR1Step.tsx` (new)
- `frontend/features/assessment/components/constants/nr1-options.ts` (new)
- `frontend/features/assessment/components/constants/steps.ts` (modify)
- `frontend/features/assessment/components/assessment.interface.ts` (modify)
- `frontend/features/assessment/components/AssessmentPage.tsx` (modify)
- `frontend/features/assessment/components/steps/B2BConsentsStep.tsx` (modify)
- `frontend/features/assessment/helpers/compute-scores.ts` (modify)

---

## 1. Files to Create

```
frontend/features/assessment/components/
├── constants/
│   └── nr1-options.ts                    # Select options, agent lists, risk bands
├── steps/
│   └── nr1/
│       ├── PerfilStep.tsx                # Department + role + work_time
│       ├── FisicoStep.tsx                # 5 Likert physical hazard fields
│       ├── QuimicoStep.tsx               # Multi-select chemical agents + textarea
│       ├── BiologicoStep.tsx             # Multi-select biological agents + textarea
│       ├── ErgonomicoStep.tsx            # 7 Likert ergonomic fields
│       ├── PsicossocialStep.tsx          # 10 Likert psychosocial fields
│       ├── AcidentesStep.tsx             # Conditional booleans + textareas
│       └── PercepcaoNR1Step.tsx          # Satisfaction Likert + free text
```

## 2. What to Build

### 2a. `nr1-options.ts` — Constants

Export `WORK_TIME_OPTIONS`, `CHEMICAL_AGENTS`, `BIOLOGICAL_AGENTS`, `NR1_RISK_BANDS` as defined in PRD §9. Also export Likert labels:

```typescript
export const LIKERT_5_LABELS = [
  { value: 1, label: 'Nenhum / Muito Baixo' },
  { value: 2, label: 'Baixo' },
  { value: 3, label: 'Moderado' },
  { value: 4, label: 'Alto' },
  { value: 5, label: 'Muito Alto' },
] as const;
```

### 2b. Step Components

All 8 steps follow the existing `StepComponentProps` pattern. Each receives `data`, `setData`, `onPrev`, `onNext`, `companyContext`.

**PerfilStep.tsx** — Step 1
- `department`: select from `companyContext.departments` (already available)
- `role`: free text input
- `nr1_work_time`: select from `WORK_TIME_OPTIONS`
- All required. Show validation on Next.

**FisicoStep.tsx** — Step 2
- 5 Likert fields: `noise_level`, `temperature_level`, `lighting_level`, `vibration_level`, `humidity_level`
- Each uses `LIKERT_5_LABELS`. Render as radio button group or slider.
- Title: "Riscos Físicos". Subtitle: "Avalie a exposição no seu ambiente de trabalho."

**QuimicoStep.tsx** — Step 3
- `chemical_exposures`: multi-select checkboxes from `CHEMICAL_AGENTS`
- `chemical_details`: optional textarea ("Descreva detalhes adicionais")
- No score — feeds inventory/AI context only.

**BiologicoStep.tsx** — Step 4
- `biological_exposures`: multi-select checkboxes from `BIOLOGICAL_AGENTS`
- `biological_details`: optional textarea
- No score.

**ErgonomicoStep.tsx** — Step 5
- 7 Likert fields: `posture_level`, `repetition_level`, `manual_force_level`, `breaks_level`, `screen_level`, `mobility_level`, `cognitive_effort_level`
- Each uses `LIKERT_5_LABELS`.

**PsicossocialStep.tsx** — Step 6
- 10 Likert fields: `workload_level`, `pace_level`, `autonomy_level`, `leadership_level`, `relationships_level`, `recognition_level`, `clarity_level`, `balance_level`, `violence_level`, `harassment_level`
- Group visually: first 8 fields under "Fatores Organizacionais", last 2 under "Violência e Assédio" with distinct styling (these surface independent alerts).

**AcidentesStep.tsx** — Step 7
- 4 conditional sections, each a boolean + conditional textarea:
  - `had_accident` → `accident_description`
  - `had_near_miss` → `near_miss_description`
  - `had_work_disease` → `work_disease_description`
  - `report_harassment` → `harassment_report_description`
- The harassment section has a prominent anonymity notice: "Este relato será registrado de forma totalmente anônima. Não é possível identificar quem enviou."
- If `report_harassment` is true and description is filled, the submit endpoint writes to `harassment_reports` (Phase 3 handles the write; this step just captures the data).

**PercepcaoNR1Step.tsx** — Step 8
- `satisfaction_level`: Likert 1-5
- `biggest_risk`: free text ("Na sua opinião, qual o maior risco no seu ambiente de trabalho?")
- `suggestion`: textarea ("Tem alguma sugestão de melhoria?")

### 2c. Modify `steps.ts` — Replace `B2B_STEPS`

Replace the current `B2B_STEPS` array (which lists SRQ-20, PHQ-9, GAD-7, etc.) with:

```typescript
export const B2B_STEPS: StepDefinition[] = [
  { id: 'welcome', label: 'Início', show: () => true },
  { id: 'b2b_consents', label: 'Consentimento', show: () => true },
  { id: 'nr1_perfil', label: 'Perfil', show: () => true },
  { id: 'nr1_fisico', label: 'Riscos Físicos', show: () => true },
  { id: 'nr1_quimico', label: 'Riscos Químicos', show: () => true },
  { id: 'nr1_biologico', label: 'Riscos Biológicos', show: () => true },
  { id: 'nr1_ergonomico', label: 'Riscos Ergonômicos', show: () => true },
  { id: 'nr1_psicossocial', label: 'Fatores Psicossociais', show: () => true },
  { id: 'nr1_acidentes', label: 'Acidentes e Doenças', show: () => true },
  { id: 'nr1_percepcao', label: 'Percepção', show: () => true },
  { id: 'resumo', label: 'Resumo & Envio', show: () => true },
]
```

If `bright_insights_enabled` is true, additional clinical steps (PHQ-9, GAD-7, ISI, MBI) are appended. Handle this in `AssessmentPage.tsx` step resolution (see 2f).

### 2d. Modify `assessment.interface.ts` — Add NR-1 Fields

Add to `AssessmentFormData` interface (alongside existing fields, which stay for Insights):

```typescript
// NR-1 Perfil
nr1_role?: string;
nr1_work_time?: string;

// NR-1 Físico
noise_level?: number;
temperature_level?: number;
lighting_level?: number;
vibration_level?: number;
humidity_level?: number;

// NR-1 Químico
chemical_exposures?: string[];
chemical_details?: string;

// NR-1 Biológico
biological_exposures?: string[];
biological_details?: string;

// NR-1 Ergonômico
posture_level?: number;
repetition_level?: number;
manual_force_level?: number;
breaks_level?: number;
screen_level?: number;
mobility_level?: number;
cognitive_effort_level?: number;

// NR-1 Psicossocial
workload_level?: number;
pace_level?: number;
autonomy_level?: number;
leadership_level?: number;
relationships_level?: number;
recognition_level?: number;
clarity_level?: number;
balance_level?: number;
violence_level?: number;
harassment_level?: number;

// NR-1 Acidentes
had_accident?: boolean;
accident_description?: string;
had_near_miss?: boolean;
near_miss_description?: string;
had_work_disease?: boolean;
work_disease_description?: string;
report_harassment?: boolean;
harassment_report_description?: string;

// NR-1 Percepção
satisfaction_level?: number;
biggest_risk?: string;
nr1_suggestion?: string;
```

Also update `INITIAL_FORM_DATA` in `initial-form-data.ts` with default values for all new fields.

Add `bright_insights_enabled` to `CompanyContext`:

```typescript
export interface CompanyContext {
  company_id?: string;
  department?: string;
  departments?: string[];
  cycle_id?: string;
  code_id?: string;
  prefilled_email?: boolean;
  bright_insights_enabled?: boolean;  // NEW
}
```

### 2e. Modify `compute-scores.ts` — NR-1 Domain Scoring

Add new exported functions alongside existing clinical scoring (which stays for Insights):

```typescript
export function scorePhysical(data: AssessmentFormData): number | null {
  const fields = [data.noise_level, data.temperature_level, data.lighting_level, data.vibration_level, data.humidity_level];
  const valid = fields.filter((f): f is number => f != null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

export function scoreErgonomic(data: AssessmentFormData): number | null;
export function scorePsychosocial(data: AssessmentFormData): number | null;
export function scoreViolence(data: AssessmentFormData): number | null;
export function scoreOverall(domains: Record<string, number | null>): number | null;
export function getNR1RiskBand(score: number): 'baixo' | 'moderado' | 'alto' | 'critico';
```

Also update `computeAllScores()` to include NR-1 domain scores in the returned record when the NR-1 fields are present:

```typescript
if (data.noise_level != null) {
  const physical = scorePhysical(data);
  if (physical != null) result.score_physical = physical;
  // ... same for ergonomic, psychosocial, violence, overall
}
```

### 2f. Modify `AssessmentPage.tsx` — Step Resolution

The `AssessmentPage` currently selects `B2B_STEPS` when `companyContext` is present. Update the step resolution:

```typescript
const steps = useMemo(() => {
  if (!companyContext?.company_id) return ALL_STEPS;
  // NR-1 base steps always shown for B2B
  let b2bSteps = [...B2B_STEPS];
  // If Insights enabled, append clinical scales after Percepção (before resumo)
  if (companyContext.bright_insights_enabled) {
    const insightsSteps = [
      { id: 'phq9', label: 'PHQ-9 — Depressão', show: () => true },
      { id: 'gad7', label: 'GAD-7 — Ansiedade', show: () => true },
      { id: 'isi', label: 'ISI — Sono', show: () => true },
      { id: 'mbi', label: 'MBI — Burnout', show: () => true },
    ];
    const resumoIdx = b2bSteps.findIndex(s => s.id === 'resumo');
    b2bSteps.splice(resumoIdx, 0, ...insightsSteps);
  }
  return b2bSteps;
}, [companyContext]);
```

Also wire the new NR-1 step IDs to their components in the step-rendering switch/map. Each `nr1_*` step ID maps to its corresponding component from `steps/nr1/`.

The `companyContext.bright_insights_enabled` value comes from the `/api/brightmonitor/me` endpoint (which reads from `companies.bright_insights_enabled`). The `me` endpoint already returns company data — ensure it includes this field (if it doesn't, it's a one-line addition in the route handler, owned by Phase 0 since that route was moved without content change; alternatively, the `/api/assessment/validate-code` endpoint returns it in the company context).

### 2g. Modify `B2BConsentsStep.tsx` — Single LGPD Consent

Replace the current multi-checkbox consent (which mixed B2B + B2C + anonymized consents) with a single LGPD consent:

- One checkbox: `lgpd_consent`
- Copy: Clear LGPD compliance text explaining anonymized data usage for occupational health assessment under NR-1.
- Required to proceed.

The `b2b_anonymized_consent`, `b2c_consent`, `b2c_contact_consent` fields stay in the interface (used by Insights flow) but are not shown in the NR-1 base flow.

---

## 4. Integration Points

- `CompanyContext.bright_insights_enabled` must be populated by the time `AssessmentPage` renders. If the `/api/brightmonitor/me` or `/api/assessment/validate-code` endpoint doesn't return it, add it. (The validate-code endpoint queries the company record — add `bright_insights_enabled` to the returned context.)
- The step components (`steps/index.ts` or equivalent barrel file) must export the new NR-1 step components so `AssessmentPage` can import them.
- `INITIAL_FORM_DATA` in `initial-form-data.ts` must have default values for all new NR-1 fields (undefined or null for optional fields).

## 5. Phase Completion Checklist

- [ ] 8 NR-1 step components created under `steps/nr1/`
- [ ] `nr1-options.ts` constants file created
- [ ] `B2B_STEPS` replaced in `steps.ts` with NR-1 step definitions
- [ ] `AssessmentFormData` extended with ~40 NR-1 fields
- [ ] `CompanyContext` extended with `bright_insights_enabled`
- [ ] `INITIAL_FORM_DATA` updated with NR-1 defaults
- [ ] NR-1 scoring functions added to `compute-scores.ts`
- [ ] `computeAllScores()` includes NR-1 domain scores
- [ ] `AssessmentPage.tsx` resolves NR-1 steps for B2B, appends Insights steps when flag is true
- [ ] `B2BConsentsStep.tsx` rewritten for single LGPD consent
- [ ] Step components render correctly in dev (manual test)
- [ ] Form data persists to localStorage correctly across steps

**Next:** `PHASE_3_brightmonitor_nr1_realign_submit.md` — Submit endpoint writes NR-1 columns + incidents + harassment
