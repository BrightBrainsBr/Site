# BrightMonitor NR-1 — Phase 2: B2B Assessment Form

**Cursor Agent:** /frontend-engineer
**Wave:** 1
**Objective:** Create the dedicated B2B assessment form with SRQ-20, AEP, Canal de Percepção, and LGPD consent steps. Wire B2B mode to show these steps instead of the clinical scales.
**Depends on:** None (form steps don't query new tables)

**Files owned by this phase:**
- `frontend/features/assessment/components/constants/scales/srq20.ts`
- `frontend/features/assessment/components/constants/scales/aep.ts`
- `frontend/features/assessment/components/steps/SRQ20Step.tsx`
- `frontend/features/assessment/components/steps/AEPStep.tsx`
- `frontend/features/assessment/components/steps/CanalPercepcaoStep.tsx`
- `frontend/features/assessment/components/steps/B2BConsentsStep.tsx`
- `frontend/features/assessment/helpers/compute-scores.ts` (modify)
- `frontend/features/assessment/components/assessment.interface.ts` (modify)
- `frontend/features/assessment/components/constants/steps.ts` (modify)
- `frontend/features/assessment/components/constants/scales/index.ts` (modify)
- `frontend/features/assessment/components/constants/scoring-ranges.ts` (modify)
- `frontend/features/assessment/components/AssessmentPage.tsx` (modify)

---

## 1. Files to Create

```
features/assessment/
├── components/
│   ├── constants/
│   │   └── scales/
│   │       ├── srq20.ts          # NEW
│   │       └── aep.ts            # NEW
│   └── steps/
│       ├── SRQ20Step.tsx         # NEW
│       ├── AEPStep.tsx           # NEW
│       ├── CanalPercepcaoStep.tsx # NEW
│       └── B2BConsentsStep.tsx    # NEW
```

## 2. What to Build

### `scales/srq20.ts`

Source data: `claude_artifact/new_products/2.2_bright_detection/v3_docs/BrightMonitor-forms (5).html` lines 242-319.

Export `SRQ20_QUESTIONS` — 20 questions in 4 categories:
- Sintomas Somáticos (6 questions, indices 0-5)
- Humor, Energia e Motivação (6 questions, indices 6-11)
- Cognição e Funcionamento (5 questions, indices 12-16)
- Ansiedade e Tensão (3 questions, indices 17-19)

Each question: `{ q: string, hint: string, category: string, icon: string }`

Export `SRQ20_RANGES`:
- 0-7: "Sem indicação de transtorno" (green)
- 8-11: "Risco moderado" (yellow)
- 12-16: "Risco elevado" (orange)
- 17-20: "Risco crítico" (red)

Export `SRQ20_CATEGORY_MAP`: group indices + max per category.

### `scales/aep.ts`

Source data: `BrightMonitor-forms (5).html` lines 151-237.

Export `AEP_QUESTIONS` — 14 Likert questions in 6 dimensions:
- Pressão por Metas (3 questions)
- Autonomia e Controle (2 questions)
- Pausas e Jornada (2 questions)
- Relações Interpessoais (3 questions)
- Demandas Cognitivas (2 questions)
- Ambiente e Organização (2 questions)

Each: `{ q: string, hint: string, category: string, icon: string, reverse: boolean }`

Export `AEP_REVERSE_INDICES = [1, 3, 4, 5, 6, 7, 8, 9, 12, 13]` (0-indexed).

Export `AEP_RANGES`: 0-14 Baixo, 15-28 Moderado, 29-42 Elevado, 43-56 Crítico.

Export `AEP_CATEGORY_DEFINITIONS`: name, indices, maxScore per dimension.

### `SRQ20Step.tsx`

Follow the pattern from `GenericScaleStep` but with binary Sim/Não buttons instead of Likert scale.

- Group questions by category with section dividers
- Each question shows hint text below
- Sim = 1, Não = 0
- Question 12 (suicidal ideation): if answered "Sim", show CVV alert card (188 hotline)
- Store as `srq20_answers: number[]` in formData

### `AEPStep.tsx`

Two sub-sections within the step:
1. 14 Likert questions (Nunca=0 → Sempre=4) with category groupings
2. Q15 open-ended: "Se pudesse mudar uma coisa..." → textarea

- Show reverse-scored indicator if desired (or handle silently in scoring)
- Store answers as `aep_answers: number[]` and `aep_percepcao_livre: string`
- After all 14 answered, show per-dimension score summary at bottom

### `CanalPercepcaoStep.tsx`

Risk perception form (anonymous by design — no identifying data stored with it).

Fields:
- `urgencia`: radio — "Preciso de ajuda agora" / "Registro para melhoria futura"
- `tipo`: button group — 9 categories (Estresse, Sobrecarga, Assédio moral, Assédio sexual, Conflito, Condições físicas, Falta de recursos, Discriminação, Outro)
- `frequencia`: radio — Isolado / Recorrente / Contínuo
- `setor`: button group — from company departments + "Outro"
- `impacto`: radio — Baixo / Moderado / Alto / Crítico
- `descricao`: textarea (required)
- `sugestao`: textarea (optional)

If urgência = "urgente", show red alert: CVV + company support channels.

Store as `canal_percepcao: { urgencia, tipo, frequencia, setor, impacto, descricao, sugestao }`.

### `B2BConsentsStep.tsx`

Three checkboxes, each with full legal text:

1. `b2b_anonymized_consent`: "Autorizo o uso dos meus dados de forma anonimizada para análises consolidadas de indicadores da empresa."
2. `b2c_consent`: "Autorizo que meus dados sejam salvos no banco de dados da Bright Brains para que possam ser utilizados no contexto da relação 'médico-paciente' caso eu venha a realizar uma consulta nesta clínica."
3. `b2c_contact_consent`: "Autorizo o uso dos meus dados de contato para receber comunicados da Bright Brains."

Checkbox 1 is required. Checkboxes 2 and 3 are optional.

### Modifications to Existing Files

**`assessment.interface.ts`**: Add to `AssessmentFormData`:
```typescript
srq20_answers: number[]        // length 20, values 0 or 1
aep_answers: number[]          // length 14, values 0-4
aep_percepcao_livre: string    // Q15 open text
canal_percepcao: {
  urgencia: string
  tipo: string
  frequencia: string
  setor: string
  impacto: string
  descricao: string
  sugestao: string
} | null
b2b_anonymized_consent: boolean
b2c_consent: boolean
b2c_contact_consent: boolean
```

**`compute-scores.ts`**: Add:
```typescript
function scoreSRQ20(answers: number[]): number
  // Sum all answers (each 0 or 1). Total range: 0-20.

function scoreAEP(answers: number[]): {
  total: number, pressure: number, autonomy: number,
  breaks: number, relationships: number, cognitive: number, environment: number
}
  // Apply reverse scoring to indices in AEP_REVERSE_INDICES
  // Sum per dimension based on AEP_CATEGORY_DEFINITIONS
  // Total = sum of all adjusted answers (range 0-56)
```

**`steps.ts`**: Add B2B step set:
```typescript
export const B2B_STEPS: StepDefinition[] = [
  { id: 'welcome-b2b', label: 'Início', show: () => true },
  { id: 'personal-data', label: 'Dados Pessoais', show: () => true },
  { id: 'srq20', label: 'SRQ-20', show: () => true },
  { id: 'aep', label: 'AEP', show: () => true },
  { id: 'canal-percepcao', label: 'Canal de Percepção', show: () => true },
  { id: 'b2b-consents', label: 'Consentimentos', show: () => true },
  { id: 'summary-b2b', label: 'Resumo', show: () => true },
]
```

**`AssessmentPage.tsx`**: When `companyContext` is present, use `B2B_STEPS` instead of `ALL_STEPS`. Add `SRQ20Step`, `AEPStep`, `CanalPercepcaoStep`, `B2BConsentsStep` to the step switch.

**`scoring-ranges.ts`**: Add SRQ-20 and AEP ranges for the summary/result display.

**`scales/index.ts`**: Export new scale files.

## 3. Phase Completion Checklist

- [ ] File created: `scales/srq20.ts` with 20 questions + ranges
- [ ] File created: `scales/aep.ts` with 14+1 questions + ranges + reverse indices
- [ ] File created: `SRQ20Step.tsx` with CVV alert
- [ ] File created: `AEPStep.tsx` with Likert + open question + score summary
- [ ] File created: `CanalPercepcaoStep.tsx` with all fields
- [ ] File created: `B2BConsentsStep.tsx` with 3 checkboxes
- [ ] Modified: `assessment.interface.ts` with new B2B fields
- [ ] Modified: `compute-scores.ts` with `scoreSRQ20()` + `scoreAEP()`
- [ ] Modified: `steps.ts` with `B2B_STEPS`
- [ ] Modified: `AssessmentPage.tsx` to branch on `companyContext`
- [ ] Modified: `scoring-ranges.ts` + `scales/index.ts`
- [ ] SRQ-20 and AEP visible only in B2B mode
- [ ] Clinical scales (PHQ-9, GAD-7, etc.) hidden in B2B mode

**Next:** `PHASE_3_nr1_laudo_ai_pipeline.md` — Laudo Individual AI generation + PDF
