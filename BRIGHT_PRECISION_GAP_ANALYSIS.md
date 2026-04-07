# Bright Precision (B2B / BrightMonitor NR-1) — Gap Analysis

**Last updated:** 2026-04-06  
**Status:** Post-session audit after initial Friday build

---

## Summary

The B2B product is substantially built but several pieces are unwired or incomplete.  
Three user types exist: **Bright Brains admin**, **Company HR admin**, **Company employee**.  
The table below is the fastest way to see what works vs what's missing.

---

## User Type Map

| User | How they get in | What they see | Status |
|------|----------------|---------------|--------|
| **Bright Brains admin** | Portal code → `/portal/empresas` | All companies + BrightMonitor NR-1 dashboard per company | ✅ Working |
| **Company HR admin** | Supabase invite → `/empresa/dashboard` | BrightMonitor NR-1 dashboard for their company | ✅ Working |
| **Company employee** | Access code or email invite → `/avaliacao` | B2B assessment (7 steps), then thank-you screen | ⚠️ Partial — see gaps below |

---

## What Was Fixed (Session 1 — 2026-04-04)

| # | What | File(s) |
|---|------|---------|
| 1 | **Compliance count bug** — API returned `totalCount` but UI expected `totalItems` | `app/api/b2b/[companyId]/compliance/route.ts` |
| 2 | **B2B dev mode** — `?company_id=UUID` in URL activates B2B 7-step flow in dev | `features/assessment/components/AssessmentPage.tsx` |
| 3 | **B2B prefill data** — "Preencher Teste" fills SRQ-20, AEP, Canal de Percepção, consents, jumps to `Resumo & Envio` | `features/assessment/helpers/generate-test-data.ts` |

## What Was Fixed (Session 2 — 2026-04-06)

| # | What | File(s) |
|---|------|---------|
| 4 | **Consent fields wired** — `b2b_anonymized_consent`, `b2c_consent`, `b2c_contact_consent` now sent to submit API | `features/assessment/components/steps/SummaryStep.tsx` |
| 5 | **Employee laudo polling** — After B2B submission, SummaryStep polls `/api/assessment/laudo-status` every 12s and shows a "Baixar PDF" button when the laudo is ready | `SummaryStep.tsx`, `app/api/assessment/laudo-status/route.ts` (new) |
| 6 | **B2C consent lead notification** — When a B2B employee gives `b2c_consent=true`, a webhook fires to the clinic after the laudo is stored | `agents/b2b-laudo/services/b2b-laudo.nodes.ts`, `b2b-laudo.storage.ts`, `send-email.ts` |
| 7 | **Action plan "Gerar com IA" baseline** — No longer fails when there are no evaluations; now generates a compliant NR-1 onboarding action plan | `agents/action-plan-generator/services/action-plan-generator.nodes.ts`, `prompts/` |
| 8 | **UI text cleanup** — Removed "NR-1" from dashboard sidebar subtitle, tab label ("Compliance NR-1" → "Compliance"), KPI row, PDF footer | `B2BDashboardComponent.tsx`, `B2BComplianceTab.tsx`, `B2BKpiRowComponent.tsx`, `b2b-laudo.nodes.ts` |

---

## How to Test Today (Dev)

```
# B2B assessment (7 steps, with prefill button):
http://localhost:3000/pt-BR/avaliacao?company_id=11111111-1111-1111-1111-111111111111

# BrightMonitor NR-1 dashboard (portal — requires portal access code):
http://localhost:3000/pt-BR/portal/empresas/11111111-1111-1111-1111-111111111111

# Company HR dashboard (requires Supabase login as company_users):
http://localhost:3000/pt-BR/empresa/dashboard
```

**Portal access:** Enter the portal code from `assessment_access_codes` where `label ILIKE '%Portal%'` and `active = true`. Once authenticated, the full BrightMonitor dashboard opens.

---

## Dashboard Tabs — Current State

| Tab | API | Data | Issues |
|-----|-----|------|--------|
| Visão Geral | `/api/b2b/[id]/overview` | ✅ Real | None |
| Setores | `/api/b2b/[id]/departments` | ✅ Real (SRQ-20, AEP columns) | None |
| GRO Psicossocial | `/api/b2b/[id]/gro` | ✅ Real (AEP dimensions, SRQ-20 distribution) | None |
| Plano de Ação | `/api/b2b/[id]/action-plans` | ✅ Real CRUD | "Gerar com IA" button exists — AI agent may or may not be wired (see #G4) |
| Eventos & Nexo | `/api/b2b/[id]/events` | ✅ Real CRUD | None |
| Percepção Organizacional | `/api/b2b/[id]/percepcao` | ✅ Real | None |
| Compliance NR-1 | `/api/b2b/[id]/compliance` | ✅ Real (now fixed) | 16-data-retention item is always "Pendente" (infrastructure scope — expected) |
| Relatórios | `/api/b2b/[id]/reports` | ✅ jsPDF generation exists | Needs real-world test; format validation pending client approval |
| Config. NR-1 | `/api/b2b/[id]/settings` | ✅ Departments + email domains + invite HR | None |

---

## Open Gaps (Prioritized)

### 🔴 Critical — Blocks the core B2B value proposition

**G1 — Employee individual "Relatório Preliminar" is not generated**  
After a company employee submits the B2B assessment, they see a thank-you screen. There is **no individual preliminary report** (1-2 pages in plain language) generated for the employee.  
The PRD specifies this as a core deliverable.  
- `SummaryStep.tsx` submits to `/api/assessment/submit` → triggers the full clinical report pipeline  
- A separate short B2B-specific report (prompt → PDF) needs to be built  
- **Blocks:** Employee value proposition ("what do I personally get from this?")  
- **Files to create:** New backend agent for B2B preliminary report + frontend display post-submission

**G2 — B2C consent conversion not wired**  
`B2BConsentsStep` collects `b2c_consent: boolean`. This is saved in form data and submitted.  
There is **no downstream logic** that turns `b2c_consent=true` into a B2C lead (e.g., creating a consultation request, sending email, or flagging in the portal).  
- **Blocks:** The B2B → B2C upsell funnel

**G3 — Company employee has no personal dashboard/results page**  
After completing the assessment, the employee only sees a success screen with the evaluation ID.  
There is **no route or page** where the employee can later view their individual results.  
Per the PRD, the employee should receive their preliminary report and optionally book a B2C consultation.  
- **Missing route:** `/pt-BR/avaliacao/resultado/[evaluationId]` or similar  
- **Missing component:** Employee-facing individual analysis view

---

### 🟡 Important — Functional gaps that affect HR experience

**G4 — "Gerar com IA" in Plano de Ação needs validation**  
`B2BActionPlanTab.tsx` has a "Gerar com IA" button that calls `invokeActionPlanAgent.ts`.  
It is unclear whether the LangGraph agent backend is deployed and responding.  
- **To test:** Click "Gerar com IA" on the Plano de Ação tab (requires a company with assessments)
- **File:** `app/api/b2b/[companyId]/action-plans/lib/invokeActionPlanAgent.ts`

**G5 — Portal "Dashboard" / "Configurações" switcher hidden by sidebar**  
`PortalEmpresaDetailPageComponent` wraps `B2BDashboardComponent` but both render their own navigation.  
The `fixed inset-y-0 left-0 z-30` sidebar from `B2BDashboardComponent` visually conflicts with the outer portal wrapper that has "Dashboard | Configurações" view switcher buttons.  
The settings tab in B2BDashboardComponent (only in portal mode) makes the "Configurações" button in the outer wrapper redundant.  
- **Recommendation:** Remove the outer "Dashboard | Configurações" switcher; rely only on the B2BDashboard sidebar. Or hide the outer switcher when in portal mode.  
- **File:** `features/portal/components/PortalEmpresaDetailPageComponent.tsx`

**G6 — Portal layout metadata still says "Portal Clínico | Comitê Médico"**  
`app/[locale]/portal/layout.tsx` metadata title describes the old clinical committee portal.  
Should read something like "BrightMonitor | Bright Brains" or "Portal NR-1".  
- **File:** `app/[locale]/portal/layout.tsx`

**G7 — Domain-based auto-registration not fully surfaced**  
`CompanySettingsComponent` allows adding allowed email domains. The `/api/b2b/me` route checks these.  
When an employee with a matching email domain registers, they are set as `isCollaborator = true` and redirected to `/avaliacao`.  
This works, but **there is no in-app UI** telling the employee they were auto-detected as a company collaborator, or which company they belong to, or what they should do next.  
- **Missing:** A lightweight "welcome" screen when a collaborator first arrives at `/avaliacao` with company branding

**G8 — Invite email for company employees (not HR) has no flow**  
HR can invite individual employees by email via `company_access_codes` with `employee_email` set. The invite creates a Supabase auth invite + `company_access_codes` row. But:
- There is no UI in the dashboard for HR to invite individual employees by email (only "Invite HR" exists in Config. NR-1)
- The invite email template (sent by Supabase) may need customization
- **Missing:** "Convidar Colaborador" form in the Config. NR-1 tab or Settings

---

### 🟢 Nice to Have — Scope for later

**G9 — Relatório GRO PDF format validation**  
The GRO Consolidated PDF is generated by jsPDF in `reports/route.ts`. The format has not been validated by the client (Bright Brains). Once validated, the template may need adjustments.

**G10 — SRQ-20 questions locale validation**  
`SRQ20Step.tsx` imports `SRQ20_QUESTIONS` from a constants file. Whether these are the OMS-validated Portuguese version or a draft needs clinical team sign-off (C2 in the escopo doc).

**G11 — AEP questions are placeholders**  
`AEPStep.tsx` imports questions from a constants file. The AEP (Avaliação Ergonômica Preliminar) 15-question text was listed as `BLOCKER C1` in the escopo doc (must be provided by Dra. Soraya). Verify whether the current questions are final or placeholder.

**G12 — Canal Anônimo (public anonymous reporting) not implemented**  
The escopo doc describes a public form (`/canal-anonimo`) where employees report issues anonymously without login. Currently only `CanalPercepcaoStep.tsx` inside the assessment captures this data.  
A standalone public page for anonymous reports is not yet built.

**G13 — NR-1 Inventory PDF needs company fields populated**  
`nr1-inventory/route.ts` generates a PDF with 9 NR-1 required fields. Fields 7–9 (process descriptions, activities, preventive measures) come from `companies.nr1_process_descriptions`, `.nr1_activities`, `.nr1_preventive_measures`. These fields are editable in Config. NR-1 settings — but the UI may not surface them prominently enough for HR admins to know they need to fill them.  
Check `CompanySettingsComponent.tsx` for NR-1 fields section.

**G14 — Compliance item for data retention is always "Pendente"**  
Item 16 (1.5.7.3.3.1 — 20-year data retention) is hardcoded as `pendente` with note "infrastructure scope — in evaluation". This is expected but the client should be aware.

**G15 — Portal page title says "Portal Clínico" in browser tab**  
The `<title>` in `portal/layout.tsx` should be updated.

---

## B2B Assessment Flow — Current 7 Steps

```
1. Bem-vindo (Bright Precision)
2. Dados Pessoais
3. SRQ-20 (20 yes/no OMS questions)
4. AEP (15 ergonomic perception questions)
5. Canal de Percepção (anonymous perception report embedded in form)
6. Consentimentos B2B (anonymization + optional B2C consent)
7. Resumo & Envio
```

**Dev test URL:** `http://localhost:3000/pt-BR/avaliacao?company_id=<UUID>`  
**Prefill button:** Click "Preencher Teste" (amber button, dev-only) → fills all B2B fields → jumps to step 7 ready to submit

---

## File Reference Map

| Feature | Key File |
|---------|----------|
| Portal empresa detail | `features/portal/components/PortalEmpresaDetailPageComponent.tsx` |
| BrightMonitor dashboard | `features/b2b-dashboard/components/B2BDashboardComponent.tsx` |
| Company HR dashboard route | `app/[locale]/empresa/dashboard/page.tsx` |
| Assessment page | `features/assessment/components/AssessmentPage.tsx` |
| B2B steps list | `features/assessment/components/constants/steps.ts` |
| B2B test data | `features/assessment/helpers/generate-test-data.ts` |
| SRQ-20 step | `features/assessment/components/steps/SRQ20Step.tsx` |
| AEP step | `features/assessment/components/steps/AEPStep.tsx` |
| Canal Percepção step | `features/assessment/components/steps/CanalPercepcaoStep.tsx` |
| B2B Consents step | `features/assessment/components/steps/B2BConsentsStep.tsx` |
| Summary + submission | `features/assessment/components/steps/SummaryStep.tsx` |
| Compliance API | `app/api/b2b/[companyId]/compliance/route.ts` |
| Reports API (jsPDF) | `app/api/b2b/[companyId]/reports/route.ts` |
| NR-1 Inventory PDF | `app/api/b2b/[companyId]/nr1-inventory/route.ts` |
| Action plan AI agent | `app/api/b2b/[companyId]/action-plans/lib/invokeActionPlanAgent.ts` |
| HR invite (portal) | `app/api/portal/companies/[id]/invite-hr/route.ts` |
| B2B session / auth | `app/api/b2b/me/route.ts`, `app/api/b2b/lib/getB2BUser.ts` |

---

## Recommended Next Steps (Ordered by Impact)

1. **G1 — Build employee preliminary report** (biggest value gap): after B2B submission, call AI to generate 1-2 page individual report and show it in a `/avaliacao/resultado/[id]` page
2. **G8 — Add "Convidar Colaborador" form** to Config. NR-1 tab so HR can invite employees by email
3. **G2 — Wire B2C consent** to create a Supabase record / trigger a consultation booking flow
4. **G5 — Fix portal layout** (remove redundant outer wrapper navigation)
5. **G4 — Test "Gerar com IA"** in Plano de Ação with real data
6. **G6/G15 — Update portal metadata** title from "Portal Clínico" to "BrightMonitor NR-1"
7. **G11/G10 — Validate AEP and SRQ-20 questions** with clinical team before going live
