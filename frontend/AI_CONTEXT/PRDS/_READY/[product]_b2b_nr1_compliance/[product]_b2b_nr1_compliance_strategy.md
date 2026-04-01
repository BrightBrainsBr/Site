# Bright Precision B2B NR-1 Compliance — Strategy PRD

**Version:** 1.1
**Date:** 30 March 2026 (updated)
**Author:** Oliver + AI
**Status:** Strategy Draft — Refine before implementation detail

---

> **The B2B dashboard was built as a proof-of-concept with half-real, half-hardcoded data. Now NR-1 enforcement starts May 26 and the client wants the full BrightMonitor NR-1 dashboard — 7 new tabs, 2 new assessment instruments that don't exist yet, 4 entirely new feature modules (action plans, events, anonymous channel, GRO), a preliminary employee report powered by AI, and the NR-1 occupational risk inventory PDF. This strategy maps exactly what needs to be built, what data doesn't exist yet, and where every file goes.**

---

## 1. The Problem

The existing B2B dashboard (`[product]_b2b_company_dashboard`) was Phase 1 — it proved the concept by wiring real evaluation data into a company-facing UI. But it has three critical gaps:

- **Half the dashboard is fake.** The Compliance tab has 9 hardcoded checklist items, a hardcoded timeline, and hardcoded legal docs. The Risk Map tab has hardcoded hierarchy data and hardcoded risk factors. The v1 scope document (`escopo_b2b_nr1_v1.html`) mapped exactly which areas are real vs fictitious — and the fictitious parts are the ones companies need for NR-1 compliance.

- **The assessment doesn't collect NR-1-required instruments.** The client's NR-1 dashboard HTML references SRQ-20 (WHO mental health screening, 20 questions) and AEP (Avaliacao Ergonomica Preliminar, 15 questions across 6 dimensions). Neither exists in the current assessment form. The current form collects 16 neuropsychological scales (PHQ-9, GAD-7, ISI, MBI, etc.) — all clinically valuable but none are the NR-1-mandated instruments. Without SRQ-20 and AEP data, 60% of the new dashboard tabs have nothing to show.

- **Four entire features don't exist.** The client sent `BrightMonitor_Dashboard_NR1.html` — a 553-line React prototype with 7 tabs. Four of those tabs (GRO Psicossocial, Plano de Acao, Eventos & Nexo, Canal Anonimo) have zero backend support. No tables, no APIs, no UI components. Each requires full CRUD, new database tables, and dedicated UI.

Additionally:
- **B2B employees get no report.** When an employee completes the assessment via a company code, the system generates the same 15-page clinical report meant for the medical committee. This is wasteful (~2 min AI processing, unnecessary tokens) and the company can't see it (LGPD). Employees should receive a short, accessible preliminary report that serves as a B2C lead-gen mechanism.
- **No employee completion tracking.** Company admins and Bright Brains admins cannot see which employees have completed evaluations vs which haven't.

**Deadline:** NR-1 enforcement begins **26 May 2026** — 57 days from today.

**Client context:** The client is cost-sensitive and keeps changing requirements mid-development. They use AI to generate dashboards and PDFs that look polished but assume backend capabilities that don't exist. Everything in their HTML dashboard is aspirational — we need to validate each module before building it. This strategy exists to protect us from scope creep by clearly defining what's needed, what's optional, and what's the client hallucinating.

**Pricing model:** Per company, possibly per company per employee — TBD by client's sales team.

---

## 2. Current State Analysis

### What Exists Today

| Asset | File / Location | Status | Details |
|-------|-----------------|--------|---------|
| B2B Dashboard shell | `features/b2b-dashboard/components/B2BDashboardComponent.tsx` | Live | Tab router with 7 tabs (overview, risk map, domains, compliance, alerts, reports, settings) |
| Overview tab | `features/b2b-dashboard/components/tabs/B2BOverviewTab.tsx` | **Real** | Risk distribution donut, score evolution, dept bar charts — from `GET /api/b2b/[id]/overview` |
| Risk Map tab | `features/b2b-dashboard/components/tabs/B2BRiskMapTab.tsx` | **Partial** | Dept table is real (from API). `HIERARCHY_DATA` (lines 42-48) and `RISK_FACTORS` (lines 32-40) are hardcoded static arrays |
| Domains tab | `features/b2b-dashboard/components/tabs/B2BDomainsTab.tsx` | **Real** | Per-instrument health scores from `GET /api/b2b/[id]/domains` |
| Compliance tab | `features/b2b-dashboard/components/tabs/B2BComplianceTab.tsx` | **Mostly fake** | Only `coveragePct`, `approvedCount`, `totalEvaluations` from API. `CHECKLIST_ITEMS` (9 items, lines 10-65), `TIMELINE_ITEMS` (7 items, lines 67-110), `LEGAL_DOCS` (4 items, lines 112-123) are ALL hardcoded |
| Alerts tab | `features/b2b-dashboard/components/tabs/B2BAlertsTab.tsx` | **Real** | Anonymized alert cards from `GET /api/b2b/[id]/alerts`. Action plan text is static |
| B2B aggregation APIs | `app/api/b2b/[companyId]/overview\|departments\|domains\|compliance\|alerts` | Live | Query `mental_health_evaluations` by `company_id` + `cycle_id`, compute normalized scores |
| Assessment form | `features/assessment/components/AssessmentPage.tsx` | Live | 27-step form with 16 clinical scales |
| Score computation | `features/assessment/helpers/compute-scores.ts` | Live | `computeAllScores()` — sums/reverses 16 scale arrays |
| Risk utilities | `app/api/b2b/lib/riskUtils.ts` | Live | `computeNormalizedScore()`, `getRiskLevel()` — wellness-style 0-100 scale (lower = worse) |
| AI report pipeline | `app/api/assessment/lib/generate-report-background.ts` | Live | 2-stage Claude pipeline: Stage 1 (sections 1-5), Stage 2 (sections 6-10). Uses `claude-sonnet-4-6` via Anthropic SDK with OpenRouter fallback |
| Report prompts | `app/api/assessment/lib/report-prompts.ts` | Live | `STAGE_1_SYSTEM`, `STAGE_2_SYSTEM`, `DOCUMENT_EXTRACTION_SYSTEM` — all clinical, CFM 2454/2026 compliant |
| PDF generation | `app/api/assessment/generate-pdf/pdf-helpers.ts` | Live | `buildPdf()` using jspdf — A4, custom fonts, branded header/footer, markdown section parser |
| Email/webhooks | `app/api/assessment/lib/send-email.ts` | Live | n8n webhook delivery — `assessment_report_ready` / `assessment_report_error` events |
| Database: `companies` | Supabase | Live | id, name, cnpj, contact_email, active, gro_issued_at, gro_valid_until, allowed_domains, departments |
| Database: `company_users` | Supabase | Live | user_id, company_id, role |
| Database: `assessment_cycles` | Supabase | Live | company_id, label, starts_at, ends_at, is_current |
| Database: `company_access_codes` | Supabase | Live | company_id, cycle_id, code, department, employee_email, started_at, used_at, used_by_evaluation_id |
| Database: `mental_health_evaluations` | Supabase | Live | form_data (jsonb), scores (jsonb), report_markdown, report_pdf_url, company_id, cycle_id, employee_department, reviewer_status |
| Client HTML dashboard | `claude_artifact/new_products/2.2_bright_detection/BrightMonitor_Dashboard_NR1.html` | Static prototype | 7 tabs, 100% mock data, 553 lines — THIS IS THE UI TARGET |

### What's Missing

- ❌ **SRQ-20 instrument** — 20 binary questions from WHO, not in assessment form, not in scoring, not in domain mapping
- ❌ **AEP instrument** — 15 Likert questions across 6 dimensions (pressure/goals, autonomy, breaks/schedule, relationships, cognitive demands, environment), not in assessment form
- ❌ **GRO Psicossocial tab** — radar chart, AEP dimensions, SRQ-20 distribution, probability x severity matrix
- ❌ **Reports tab** — Tab exists but ALL buttons show "em construção". PDF generation, CSV export, JSON import, eSocial status, NR-1 review periodicity — all non-functional / hardcoded fake data
- ❌ **Plano de Acao tab** — COMPLEX MODULE. Client's HTML shows 8 items across 5 categories: (1) Clinical referral, (2) Operational intervention, (3) Training/workshop, (4) Service procurement, (5) Platform action. Each item has: description, department, priority (critica/alta/media), status (pendente/em_andamento/agendado/concluido), deadline, responsible. Three complexity tiers: Nivel 1 = manual CRUD form, Nivel 2 = template library + rule-based suggestions + deadline reminders, Nivel 3 = AI-generated plans + in-platform notifications. Client needs to decide which tier. Currently NO notification system exists in the platform.
- ❌ **Eventos & Nexo tab** — incident/sick-leave diary with CID-10 codes, days lost, sector correlation
- ❌ **Canal Anonimo tab** — anonymous employee reporting channel with categories, urgency, correlation analysis
- ❌ **Preliminary B2B employee report** — simplified AI report for employees (not the 15-page clinical one)
- ❌ **NR-1 Inventory PDF** — 9-field mandatory occupational risk document (6 computed, 3 from company input)
- ❌ **Employee completion tracking** — who has/hasn't completed the assessment per company/department
- ❌ **Company NR-1 editable fields** — process descriptions, activity descriptions, preventive measures (inputs for the 9-field inventory)
- ❌ **Real compliance status** — checklist items derived from actual system data instead of hardcoded

---

## 2.5 Dashboard Evolution — NOT a Replacement

The client's `BrightMonitor_Dashboard_NR1.html` is a V2 of the EXISTING `B2BDashboardComponent.tsx`, not a separate dashboard. Same component, same route, same auth. The mapping:

| Current Tab | New Tab | What Happens |
|---|---|---|
| Overview (real) | Visão Geral | Evolves — adds SRQ-20/AEP KPIs + inline alerts |
| Risk Map (mixed) | Setores | Evolves — dept table gains per-instrument columns. Hardcoded hierarchy + risk factors deleted |
| Domains (real) | Absorbed into GRO Psicossocial | Domain averages feed radar chart. GRO adds AEP/SRQ/matrix (new) |
| Compliance (90% fake) | Compliance NR-1 | Rewritten — fake checklist → computed status |
| Alerts (real) | Absorbed into Visão Geral | Alert cards move into overview section |
| Reports (**100% broken** — all buttons show "em construção") | Relatórios | Must be REBUILT — real PDF generation + CSV export + NR-1 inventory PDF button |
| Settings | Configurações | Stays + NR-1 fields + SOP uploads |
| — | Plano de Ação | **New module** |
| — | Eventos & Nexo | **New module** |
| — | Canal Anônimo | **New module** |

**Nothing gets thrown away.** The Overview API, Departments API, Domains API, and Alerts API all continue to work — they get extended with SRQ-20/AEP fields.

---

## 2.6 Empty State / Onboarding Flow — Critical Missing Piece

When a company first signs up, they have zero evaluations. An empty dashboard is useless. The system needs an **onboarding state** that replaces the dashboard until enough data exists:

```
Company created → codes generated → employees start filling → threshold reached → dashboard activates

┌────────────────────────────────────────────────────────────────┐
│  ONBOARDING VIEW (shown when < 30% completion threshold)      │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Progress: 12 de 50 funcionários completaram (24%)      │  │
│  │  ████████░░░░░░░░░░░░░░░░░░░░░░░░░                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────┬──────────────┬──────────────┐               │
│  │ Engenharia   │ Comercial    │ RH           │               │
│  │ 8/20 (40%)   │ 2/15 (13%)  │ 2/15 (13%)   │               │
│  │ ████░░░░░░   │ █░░░░░░░░   │ █░░░░░░░░    │               │
│  └──────────────┴──────────────┴──────────────┘               │
│                                                                │
│  Funcionários que ainda não iniciaram:                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Email              │ Departamento │ Status    │ Ação    │  │
│  │ joao@empresa.com   │ Engenharia   │ Pendente  │ Reenviar│  │
│  │ maria@empresa.com  │ Comercial    │ Iniciou   │ Lembrar │  │
│  │ ...                │              │           │         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  [Enviar lembrete para todos pendentes]                        │
│  [Exportar lista de pendentes (CSV)]                           │
└────────────────────────────────────────────────────────────────┘
```

The employee tracking table shows:
- `employee_email` from `company_access_codes`
- `department` from `company_access_codes`
- Status: Pendente (code generated, no `started_at`) / Iniciou (has `started_at`, no `used_at`) / Completou (has `used_at`)
- Action: Reenviar link / Lembrar (for those who started but didn't finish)

This is NOT a new API — the data already exists in `company_access_codes` (`started_at`, `used_at`, `employee_email`). We just need `GET /api/b2b/[companyId]/employee-tracking` to query it.

The onboarding view is shown instead of the regular dashboard when completion is below a threshold (configurable, default 30%). Once enough employees complete the assessment, the tabs automatically activate with real data.

---

## 2.7 User Lifecycle — All Four User Types

There are actually FOUR user types, not three. The B2C conversion creates a fourth:

```
TYPE 1: B2B EMPLOYEE (assessment user)
  Entry: Link from HR → /avaliacao?c=CODE
  Actions: Fill assessment → receive preliminary report → access anonymous channel
  Auth: None (code is credential)
  Data: stored in mental_health_evaluations with company_id

       │ (consent checkbox at end of assessment)
       ▼

TYPE 2: B2C LEAD (converted from B2B)
  Entry: CTA in preliminary report → books consultation via Bright Brains website
  Actions: The evaluation data already exists. If b2c_consent = true,
           Bright Brains can generate the full clinical report on demand
           WITHOUT the employee having to redo the assessment.
  Auth: None initially — the consultation flow is outside this system
  Data: same mental_health_evaluations row, b2c_consent = true

TYPE 3: COMPANY ADMIN (HR / SST)
  Entry: /empresa/login → email + password (Supabase Auth, invite-only)
  Actions: Dashboard, action plans, events, tracking, NR-1 inventory
  Auth: Supabase JWT → company_users
  Data: sees aggregated, anonymized data only

TYPE 4: BRIGHT BRAINS ADMIN (portal)
  Entry: /portal → OTP code
  Actions: Everything company admin can do + create companies + invite HR + generate codes
  Auth: portal_session cookie
  Data: sees same aggregated view + admin tools
```

The B2C conversion flow:
1. Employee fills B2B assessment → at the end, sees: "Deseja autorizar o uso dos seus dados para uma consulta individual na Bright Brains?" → checkbox + LGPD text
2. If yes: `b2c_consent = true` + `b2c_consent_at = now()` saved on the evaluation
3. Employee receives preliminary report with prominent CTA: "Agende sua Consulta Devolutiva"
4. Employee contacts Bright Brains (website, WhatsApp, phone) → schedules consultation
5. Bright Brains admin can now generate the FULL clinical report from the existing data — no need for the employee to redo the assessment
6. The clinical report goes through the existing comitê médico flow (review, approve, deliver)

This is a powerful lead-gen mechanism: the B2B assessment is the top of the B2C funnel.

---

## 2.8 Employee Experience Today — The Gap

Currently there is NO employee-facing view for B2B users. The full flow:

1. Employee clicks link → `/avaliacao?c=CODE` → pre-register → 27-step form → submit
2. On submit, `SummaryStep.tsx` shows an **inline success message** — "Obrigado" + loading while report generates
3. For **B2C** users, the success page shows a "Acompanhar no Portal" link to `/portal/{evaluationId}`
4. For **B2B** (corporate) users, this link is **explicitly hidden** — the employee sees only a static thank-you message

The `/empresa/dashboard` is **HR-only**. The `/empresa/perfil` page exists but is a profile component, not a results viewer. The `/portal/[id]` route is the medical committee portal (code-gated), which B2B employees cannot access.

**What this means:** When a B2B employee finishes their assessment, they get nothing. No report, no results, no follow-up. The preliminary report is the first thing they'll actually receive.

The employee's touchpoints with the platform are:
- **Assessment form** — one-time, ~30 min
- **Preliminary report** — immediately after submission (screen + PDF + email)
- **Anonymous channel** — ongoing access to report issues
- **B2C conversion CTA** — in the preliminary report PDF

They do NOT need a dashboard, a login, or a persistent portal. Each touchpoint is a standalone interaction.

---

## 2.9 B2C and B2B Assessment Form — SAME Form

**Critical finding:** The B2C and B2B assessment are the SAME form (`AssessmentPage.tsx`). There is no separate B2B form.

**How it works today:**
- B2B employee enters via company code → `companyContext.company_id` is set
- B2B forces `publico = 'adulto'` (eliminates child/neuro-only scales)
- Result: ~25 visible steps with 12 clinical scales (PHQ-9, GAD-7, ISI, ASRS, AQ-10, OCI-R, PCL-5, MDQ, MBI, PSS-10, Mini-SPIN, AUDIT-C)
- On submit: same payload + `company_id`, `employee_department`, `cycle_id`, `code_id` extra fields
- After submit: the SAME 2-stage AI report pipeline runs (full 15-page clinical report for medical committee)
- SummaryStep shows different copy but hides the portal link for B2B

**Problems with this approach:**
1. The form is very long (~25 steps, ~30 min). For corporate compliance, employees may not complete it.
2. The full clinical report (15 pages, medical jargon) is generated even for B2B — but it's not appropriate for the employee.
3. No SRQ-20 or AEP exists yet — the B2B-specific instruments haven't been built.

**Open question (BLOCKER):** Should B2B use the same full form, or a reduced NR-1-focused version? Options:
- **Option A:** Same form as B2C (~25 steps, all 12 scales) + SRQ-20 + AEP at the end = ~30 steps total
- **Option B:** Reduced form: demographics + SRQ-20 + AEP + key scales only (PHQ-9, GAD-7, MBI, PSS-10) = ~15 steps total
- **Trade-off:** Option A gives richer data for the B2C conversion funnel (employee who consents already has full clinical data). Option B has higher completion rate but limits B2C lead quality.

## 2.10 Reports Tab — 100% Non-Functional

The Reports tab (`B2BReportsTab.tsx`) exists in the dashboard but is entirely non-functional:

| Feature | What it shows | Reality |
|---------|--------------|---------|
| 5 Regulatory Reports (GRO, Executivo, Departamento, Laudo CFM, CIAT) | "Gerar PDF" buttons | All show `alert("em construção")` |
| 4 Data Exports (Excel All, Excel Dept, JSON, Action Plan) | "Download CSV/JSON" buttons | All show `alert("em construção")` |
| JSON Import (drag & drop) | Upload zone | POSTs to `/api/b2b/${companyId}/import` which does not exist |
| eSocial Status (S-2240, S-2220, S-2210) | Table with "Enviado"/"Pendente" | 100% hardcoded fake data |
| NR-1 Review Periodicity | Table with frequencies/dates | 100% hardcoded fake data |

**This tab needs to be completely rebuilt.** Open questions: which of the 5 regulatory reports are actually needed for NR-1 compliance? Is the GRO Consolidado PDF just a dump of dashboard data or a structured document?

---

## 3. The Vision / Solution

1. **SRQ-20 and AEP are B2B-only assessment steps.** When an employee enters via a company code, they see 2 additional steps after the clinical scales: SRQ-20 (20 binary questions, ~3 min) and AEP (15 Likert questions, ~3 min). These are NOT shown to B2C patients. The data is stored in the same `scores` jsonb field on `mental_health_evaluations`.

2. **The new dashboard replaces the current one tab-for-tab.** The client's `BrightMonitor_Dashboard_NR1.html` IS the target. The existing 7-tab structure gets remapped to the new 7+2 tab structure. Settings and Reports tabs remain but aren't in the HTML mockup.

3. **Employees get a preliminary report, not the clinical one.** When a B2B evaluation is submitted, the system runs a new, shorter AI prompt that produces a 1-2 page accessible report: risk level, points of attention, wellness recommendations, NR-1 context, and a CTA to book a Bright Brains consultation. This is a lead-gen mechanism. The full clinical report is NOT generated for B2B (saving ~90% token cost per evaluation).

4. **The company admin sees only aggregated, anonymized data.** No individual reports, no names, no CPFs. LGPD compliant by architecture. The preliminary report goes to the employee, not the company.

5. **New features use existing patterns.** TanStack Query hooks, Next.js API routes with Supabase service role, feature-based folder structure in `features/b2b-dashboard/`. No new infrastructure.

6. **NR-1 Inventory is the core product.** The ENTIRE point of BrightMonitor is NR-1 compliance. The 9-field inventory PDF is the deliverable companies need for labor audits. 6 fields come from aggregated assessment data (scores, SRQ-20, AEP). 3 fields come from company-editable text (process descriptions, activities, preventive measures) stored on the `companies` table. This is non-negotiable.

7. **Action plans are generated via templates, then AI.** The client explicitly stated they want these generated (template or AI). Strategy: Phase 1 = manual CRUD (company admin creates items). Phase 2 = template-based generation (deterministic rules: "If GAD-7 avg > 10 in dept X → suggest anxiety program"). Phase 3 = AI-generated suggestions (LLM analyzes aggregated data). The client is cost-sensitive — starting with templates avoids token costs and is legally defensible ("the AI told us to do this" won't fly in a labor audit). Both portal admin and company admin can manage action plans.

8. **Emergency SOPs must be in the platform.** The Kit de Emergencia Psicossocial (4 SOPs from the client's PDF) needs to be accessible within the platform, not just as external PDF downloads. This satisfies NR-1: 1.5.6 (emergency response procedures). Implementation: a dedicated section in Compliance tab or Settings tab where the SOPs are either stored as PDFs in Supabase storage or as structured text in the database, viewable/downloadable by both company admin and employees.

9. **AWS S3 + Glacier is separate scope.** Supabase already runs on AWS. The 20-year retention requirement (NR-1: 1.5.7.3.3.1) could be addressed with Supabase's built-in storage + retention policies, or with a dedicated S3 + Glacier setup. Either way, this is infrastructure work outside this feature scope. The Compliance tab should show this item as "Pendente" (honest) not "Conforme" (aspirational).

10. **B2B → B2C conversion requires explicit LGPD consent.** When an employee finishes the assessment, the preliminary report includes a CTA to book a Bright Brains consultation. If the employee wants to become a B2C client, they need to explicitly opt-in: "Autorizo o uso dos meus dados de avaliação para consulta individual na Bright Brains." This is a checkbox at the end of the assessment OR in the preliminary report. The consent flag is stored on the evaluation row. Without it, the data cannot be reused for a clinical report.

11. **Client provides the SRQ-20 and AEP questions.** The WHO SRQ-20 is a standardized instrument with a published Portuguese version (Mari & Williams, 1986). The AEP questions need to be provided by the client's clinical team (Dra. Soraya) — we build the form infrastructure, they supply the content. **This is a blocker.**

---

## 4. The System (High Level)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        BRIGHT PRECISION NR-1 — SYSTEM MAP                      │
├──────────────────────────────┬─────────────────────┬───────────────────────────┤
│                              │                     │                           │
│  COMPANY DASHBOARD           │  EMPLOYEE ASSESSMENT│  BRIGHT BRAINS ADMIN      │
│  /empresa/dashboard          │  /avaliacao          │  /portal/empresas/[id]    │
│                              │                     │                           │
│  ┌──────────────────────┐    │  ┌─────────────────┐│  ┌───────────────────────┐│
│  │ 9 Tabs:              │    │  │ Existing flow   ││  │ Company management    ││
│  │ ├ Visao Geral        │    │  │ + SRQ-20 step   ││  │ Employee tracking     ││
│  │ ├ Setores            │    │  │ + AEP step      ││  │ Action plan CRUD      ││
│  │ ├ GRO Psicossocial   │    │  │ (B2B only)      ││  │ Event registration    ││
│  │ ├ Plano de Acao      │    │  └────────┬────────┘│  │ NR-1 inventory gen    ││
│  │ ├ Eventos & Nexo     │    │           │         │  └───────────────────────┘│
│  │ ├ Canal Anonimo      │    │           ▼         │                           │
│  │ ├ Compliance NR-1    │    │  ┌─────────────────┐│                           │
│  │ ├ Relatorios         │    │  │ AI PIPELINE     ││                           │
│  │ └ Configuracoes      │    │  │                 ││                           │
│  └──────────────────────┘    │  │ B2B: Preliminary││                           │
│                              │  │   report (1 LLM ││                           │
│  ┌──────────────────────┐    │  │   call, short)  ││                           │
│  │ Anonymous Channel    │    │  │                 ││                           │
│  │ (employee-facing     │    │  │ B2C: Full       ││                           │
│  │  submission form)    │    │  │   clinical      ││                           │
│  └──────────────────────┘    │  │   report (2     ││                           │
│                              │  │   stages)       ││                           │
│                              │  └─────────────────┘│                           │
└──────────────────────────────┴─────────────────────┴───────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                            NEXT.JS API ROUTES                                  │
│                                                                                │
│  EXISTING (modify):                                                            │
│  /api/b2b/[companyId]/overview      — add SRQ-20/AEP aggregation              │
│  /api/b2b/[companyId]/departments   — add per-instrument per-dept averages    │
│  /api/b2b/[companyId]/compliance    — replace hardcoded with computed status   │
│  /api/assessment/submit             — branch B2B→preliminary vs B2C→clinical  │
│                                                                                │
│  NEW:                                                                          │
│  /api/b2b/[companyId]/gro           — SRQ-20 dist, AEP dims, risk matrix     │
│  /api/b2b/[companyId]/action-plans  — CRUD for PDCA action items              │
│  /api/b2b/[companyId]/events        — CRUD for incidents/sick-leave           │
│  /api/b2b/[companyId]/anonymous-reports  — aggregation for admin view         │
│  /api/b2b/[companyId]/employee-tracking  — completion status per employee     │
│  /api/b2b/[companyId]/nr1-inventory — generate 9-field inventory              │
│  /api/b2b/anonymous-submit          — public submission (no auth)             │
│  /api/assessment/continue-report    — modify: B2B preliminary branch          │
└────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                                SUPABASE                                        │
│                                                                                │
│  EXISTING TABLES (extend):                                                     │
│  mental_health_evaluations   — scores jsonb now includes srq20, aep_*         │
│  companies                   — add nr1_process_descriptions, nr1_activities,  │
│                                nr1_preventive_measures, sst_responsible        │
│                                                                                │
│  NEW TABLES:                                                                   │
│  b2b_action_plans            — PDCA items per company/cycle                   │
│  b2b_events                  — incidents, sick-leave, CID codes               │
│  b2b_anonymous_reports       — anonymous employee reports (NO user_id)        │
│  b2b_compliance_status       — computed NR-1 checklist state per company      │
│                                                                                │
│  STORAGE:                                                                      │
│  assessment-pdfs bucket      — also stores preliminary report PDFs            │
│  nr1-inventories bucket      — NR-1 inventory PDFs (NEW)                     │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. The Complete Pipeline

### 5.1 Assessment Flow — B2B Branch

The employee flow is identical to today until submission. At submit, the system branches:

```
Employee clicks link → /avaliacao?c=CODE
       │
       ▼ (existing)
validate-code → pre-register → 27-step clinical assessment
       │
       ▼ (NEW — B2B only)
Step 28: SRQ-20 (20 binary questions — "Sim/Nao")
Step 29: AEP (15 Likert questions across 6 dimensions)
       │
       ▼
POST /api/assessment/submit
  └─ scores now includes: { ...existing, srq20: number, aep_total: number,
     aep_pressure: number, aep_autonomy: number, aep_breaks: number,
     aep_relationships: number, aep_cognitive: number, aep_environment: number }
  └─ if company_id exists → set report_type = 'preliminary'
       │
       ▼ (BRANCHING POINT)
  ┌────────────────────────────────────────────────────────────────────┐
  │ if report_type === 'preliminary' (B2B):                           │
  │   fetch POST /api/assessment/continue-report { phase: 'b2b' }    │
  │   → 1 LLM call (not 2) with B2B_PRELIMINARY_SYSTEM prompt        │
  │   → produces ~1-2 page markdown                                   │
  │   → buildPreliminaryPdf() (lighter template)                      │
  │   → upload to assessment-pdfs bucket                              │
  │   → store as preliminary_report_markdown + preliminary_pdf_url    │
  │   → webhook: assessment_preliminary_report_ready                  │
  │                                                                    │
  │ if report_type is null (B2C):                                     │
  │   fetch POST /api/assessment/continue-report { phase: 'stage1' }  │
  │   → existing 2-stage clinical pipeline (unchanged)                │
  └────────────────────────────────────────────────────────────────────┘
```

### 5.2 Preliminary Report — AI Prompt Design

The preliminary report is a SHORT, ACCESSIBLE document for the employee. It contains:

1. **Header** — Employee name, date, attention level (Baixo / Moderado / Alto)
2. **Personalized welcome message** — empathetic, non-clinical
3. **Summary of what was assessed** — which instruments, what they measure
4. **Points of attention** — identified risk areas in plain language (NOT clinical jargon, NOT CID codes)
5. **Wellness recommendations** — practical tips (sleep, exercise, stress management)
6. **NR-1 context** — brief explanation of what this assessment means for the company's occupational health program
7. **CTA** — "Agende sua Consulta Devolutiva na Bright Brains" — LEAD GEN for B2C conversion
8. **Compliance declarations** — CFM, LGPD, NR-1 (brief)

```
New prompt file: app/api/assessment/lib/b2b-report-prompts.ts
  exports: B2B_PRELIMINARY_SYSTEM, B2B_PRELIMINARY_USER_PREFIX

New function in generate-report-background.ts:
  runPreliminaryReport(evaluationId, formData, scores, progressCb, logCb)
    → 1 LLM call (not 2)
    → max_tokens: 4096 (vs 12288 for clinical)
    → ~15-30 seconds (vs ~2 minutes for clinical)
    → returns: { markdown: string }
```

**Token cost comparison:**
- Clinical report (B2C): ~12K input + ~12K output × 2 stages = ~48K tokens per evaluation
- Preliminary report (B2B): ~8K input + ~4K output × 1 stage = ~12K tokens per evaluation
- **~75% cost reduction per B2B evaluation**

### 5.3 Preliminary Report — PDF Template

```
New function: app/api/assessment/generate-pdf/preliminary-pdf-helpers.ts
  exports: buildPreliminaryPdf(formData: AssessmentFormData, reportMarkdown: string): Buffer

Template differences from clinical PDF:
- Shorter (1-2 pages vs 10-15)
- Larger, friendlier typography
- Color-coded attention level banner (green/yellow/red)
- No CID codes, no clinical jargon
- Prominent CTA section with Bright Brains booking link
- Bright Brains branding (not BrightMonitor)
- NR-1 compliance footer
```

### 5.4 Dashboard Tab Data Flow

Each new dashboard tab needs specific data from the API:

```
TAB: Visao Geral
  └─ GET /api/b2b/[id]/overview  (existing, extend with SRQ-20/AEP summary)
  └─ GET /api/b2b/[id]/alerts    (existing)

TAB: Setores
  └─ GET /api/b2b/[id]/departments  (existing, extend with per-instrument averages)

TAB: GRO Psicossocial
  └─ GET /api/b2b/[id]/gro  (NEW)
     Returns: {
       scaleAverages: { phq9: number, gad7: number, srq20: number, ... },
       aepDimensions: { pressure: number, autonomy: number, ... },
       srq20Distribution: { negative: number, moderate: number, elevated: number, critical: number },
       riskMatrix: number[][]  // 3x4 probability x severity grid
     }

TAB: Plano de Acao
  └─ GET /api/b2b/[id]/action-plans  (NEW — returns items)
  └─ POST /api/b2b/[id]/action-plans  (NEW — create item)
  └─ PATCH /api/b2b/[id]/action-plans/[itemId]  (NEW — update status/fields)
  └─ DELETE /api/b2b/[id]/action-plans/[itemId]  (NEW)

TAB: Eventos & Nexo
  └─ GET /api/b2b/[id]/events  (NEW — returns events + KPIs)
  └─ POST /api/b2b/[id]/events  (NEW — create event)
  └─ PATCH /api/b2b/[id]/events/[eventId]  (NEW — update)
  └─ DELETE /api/b2b/[id]/events/[eventId]  (NEW)

TAB: Canal Anonimo
  └─ GET /api/b2b/[id]/anonymous-reports  (NEW — aggregated view for admin)
  └─ POST /api/b2b/anonymous-submit  (NEW — public, rate-limited, no auth)

TAB: Compliance NR-1
  └─ GET /api/b2b/[id]/compliance  (existing, REWRITE — compute real status)

TAB: Relatorios
  └─ POST /api/b2b/[id]/nr1-inventory  (NEW — generate 9-field PDF)
  └─ GET /api/b2b/[id]/nr1-inventory  (NEW — download latest)
```

### 5.5 Anonymous Channel — Employee Submission Flow

```
Employee accesses anonymous form (URL provided by company, no auth required)
  └─ /avaliacao/canal?company=[companyId]  (or dedicated route)
       │
       ▼
Form fields:
  - Tipo de relato (select): Estresse, Sobrecarga, Assedio Moral, Conflito,
    Condicoes de Trabalho, Outro
  - Descricao (textarea, required, min 20 chars)
  - Setor/departamento (select from company departments, or "Prefiro nao informar")
  - Urgencia (radio): Normal / Urgente
  - Concordo com termos de anonimato (checkbox, required)
       │
       ▼
POST /api/b2b/anonymous-submit
  body: { company_id, type, description, department?, is_urgent }
  └─ NO user_id, NO session, NO cookies — true anonymity
  └─ Rate limit: max 5 submissions per IP per hour
  └─ Insert into b2b_anonymous_reports
  └─ If is_urgent: trigger webhook/notification to company admin
       │
       ▼
Success page: "Seu relato foi registrado de forma anonima. Obrigado."
```

---

## 6. Architecture & Code Location

### Directory Structure — New and Modified Files

```
frontend/
├── app/
│   ├── [locale]/
│   │   ├── avaliacao/                        # Assessment portal
│   │   │   └── canal/                        # NEW: anonymous channel form
│   │   │       └── page.tsx                  # /avaliacao/canal?company=[id]
│   │   │
│   │   └── empresa/                          # B2B HR dashboard (existing)
│   │       └── dashboard/
│   │           └── page.tsx                  # UNCHANGED — renders B2BDashboardComponent
│   │
│   └── api/
│       ├── assessment/
│       │   ├── submit/route.ts               # MODIFY: B2B branch → preliminary report
│       │   ├── continue-report/route.ts      # MODIFY: add 'b2b' phase handler
│       │   ├── generate-pdf/
│       │   │   ├── pdf-helpers.ts            # UNCHANGED (clinical PDF)
│       │   │   └── preliminary-pdf-helpers.ts # NEW: buildPreliminaryPdf()
│       │   └── lib/
│       │       ├── report-prompts.ts         # UNCHANGED (clinical prompts)
│       │       ├── b2b-report-prompts.ts     # NEW: B2B_PRELIMINARY_SYSTEM, B2B_PRELIMINARY_USER_PREFIX
│       │       ├── generate-report-background.ts  # MODIFY: add runPreliminaryReport()
│       │       └── send-email.ts             # MODIFY: add assessment_preliminary_report_ready event
│       │
│       ├── b2b/
│       │   ├── lib/
│       │   │   ├── getB2BUser.ts             # UNCHANGED
│       │   │   └── riskUtils.ts              # MODIFY: add SRQ-20 and AEP to SCALE_MAX + DOMAIN_KEYS
│       │   │
│       │   ├── [companyId]/
│       │   │   ├── overview/route.ts         # MODIFY: include SRQ-20/AEP in aggregation
│       │   │   ├── departments/route.ts      # MODIFY: per-instrument averages per dept
│       │   │   ├── domains/route.ts          # MODIFY: add SRQ-20 and AEP domains
│       │   │   ├── compliance/route.ts       # REWRITE: compute real NR-1 status from system data
│       │   │   ├── alerts/route.ts           # UNCHANGED
│       │   │   │
│       │   │   ├── gro/route.ts              # NEW: GRO Psicossocial data aggregation
│       │   │   ├── action-plans/
│       │   │   │   ├── route.ts              # NEW: GET list + POST create
│       │   │   │   └── [planId]/route.ts     # NEW: PATCH update + DELETE
│       │   │   ├── events/
│       │   │   │   ├── route.ts              # NEW: GET list + POST create
│       │   │   │   └── [eventId]/route.ts    # NEW: PATCH update + DELETE
│       │   │   ├── anonymous-reports/route.ts # NEW: GET aggregated reports for admin
│       │   │   ├── employee-tracking/route.ts # NEW: completion status per employee
│       │   │   └── nr1-inventory/
│       │   │       └── route.ts              # NEW: POST generate + GET download
│       │   │
│       │   └── anonymous-submit/route.ts     # NEW: public anonymous submission (no auth)
│       │
│       └── portal/
│           └── companies/[id]/
│               └── route.ts                  # MODIFY: add NR-1 fields to PATCH
│
├── features/
│   ├── assessment/
│   │   ├── components/
│   │   │   ├── assessment.interface.ts       # MODIFY: add srq20, aep_* to AssessmentFormData
│   │   │   ├── steps/
│   │   │   │   ├── SRQ20Step.tsx             # NEW: SRQ-20 form step (B2B only)
│   │   │   │   └── AEPStep.tsx              # NEW: AEP form step (B2B only)
│   │   │   └── constants/
│   │   │       └── scales/
│   │   │           ├── srq20.ts              # NEW: SRQ20_QUESTIONS (20 items)
│   │   │           ├── aep.ts                # NEW: AEP_QUESTIONS (15 items, 6 dimensions)
│   │   │           └── index.ts              # MODIFY: add SRQ-20, AEP exports
│   │   └── helpers/
│   │       └── compute-scores.ts             # MODIFY: add SRQ-20 and AEP scoring
│   │
│   └── b2b-dashboard/
│       ├── b2b-dashboard.interface.ts        # MODIFY: add new types for GRO, action plans, events, etc.
│       ├── constants/
│       │   └── domain-mapping.ts             # MODIFY: add SRQ-20 and AEP to display names + max scores
│       ├── components/
│       │   ├── B2BDashboardComponent.tsx     # MODIFY: remap tabs to new structure
│       │   └── tabs/
│       │       ├── B2BOverviewTab.tsx        # REWRITE: match new HTML layout
│       │       ├── B2BSetoresTab.tsx          # NEW: replaces B2BRiskMapTab (per-sector with instruments)
│       │       ├── B2BGROTab.tsx              # NEW: GRO Psicossocial (radar, AEP, SRQ-20, matrix)
│       │       ├── B2BActionPlanTab.tsx       # NEW: Plano de Acao CRUD
│       │       ├── B2BEventsTab.tsx           # NEW: Eventos & Nexo Causal
│       │       ├── B2BCanalAnonimoTab.tsx     # NEW: Canal Anonimo aggregation view
│       │       ├── B2BComplianceTab.tsx       # REWRITE: real computed status
│       │       ├── B2BReportsTab.tsx          # MODIFY: add NR-1 inventory generation button
│       │       ├── B2BSettingsTab.tsx         # MODIFY: add NR-1 editable fields
│       │       ├── B2BAlertsTab.tsx           # DELETE (alerts absorbed into Visao Geral)
│       │       ├── B2BDomainsTab.tsx          # DELETE (absorbed into GRO tab)
│       │       └── B2BRiskMapTab.tsx          # DELETE (replaced by B2BSetoresTab)
│       ├── components/shared/
│       │   ├── B2BEmployeeTrackingComponent.tsx  # NEW: completion tracking table
│       │   └── B2BNR1FieldsComponent.tsx     # NEW: editable company NR-1 fields
│       └── hooks/
│           ├── useB2BOverview.ts              # UNCHANGED
│           ├── useB2BDepartments.ts           # UNCHANGED
│           ├── useB2BCompliance.ts            # UNCHANGED (API changes, hook stays same)
│           ├── useB2BAlerts.ts                # UNCHANGED
│           ├── useB2BGRO.ts                   # NEW: TanStack Query → /api/b2b/[id]/gro
│           ├── useB2BActionPlans.ts           # NEW: query + mutations for action plans
│           ├── useB2BEvents.ts                # NEW: query + mutations for events
│           ├── useB2BAnonymousReports.ts      # NEW: query for anonymous reports
│           ├── useB2BEmployeeTracking.ts      # NEW: query for completion status
│           └── useB2BNR1Inventory.ts          # NEW: mutation for PDF generation
```

---

## 7. Database Schema

### New Tables

```sql
-- Action plan items (Plano de Acao PDCA)
CREATE TABLE b2b_action_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id        uuid REFERENCES assessment_cycles(id),
  description     text NOT NULL,
  department      text,
  priority        text NOT NULL DEFAULT 'media'
    CHECK (priority IN ('critica', 'alta', 'media', 'baixa')),
  status          text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'agendado')),
  responsible     text,
  deadline        date,
  notes           text,
  created_by      text,                              -- 'portal-admin' or user_id
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_action_plans_company_idx ON b2b_action_plans(company_id);
CREATE INDEX b2b_action_plans_cycle_idx ON b2b_action_plans(cycle_id);
CREATE INDEX b2b_action_plans_status_idx ON b2b_action_plans(status);


-- Company events / incidents (Eventos & Nexo Causal)
CREATE TABLE b2b_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_date      date NOT NULL,
  event_type      text NOT NULL
    CHECK (event_type IN ('afastamento', 'relato_canal', 'acidente', 'outro')),
  cid_code        text,                              -- e.g. 'F41.1', 'F32.1', 'F43.2'
  description     text NOT NULL,
  department      text,
  days_lost       integer,                           -- NULL for non-afastamento events
  linked_report_id uuid REFERENCES b2b_anonymous_reports(id),
  notes           text,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_events_company_idx ON b2b_events(company_id);
CREATE INDEX b2b_events_date_idx ON b2b_events(event_date);
CREATE INDEX b2b_events_type_idx ON b2b_events(event_type);


-- Anonymous reports from employees (Canal Anonimo)
CREATE TABLE b2b_anonymous_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_type     text NOT NULL
    CHECK (report_type IN ('estresse', 'sobrecarga', 'assedio_moral',
      'conflito', 'condicoes_trabalho', 'outro')),
  description     text NOT NULL,
  department      text,                              -- optional, employee may choose not to identify
  is_urgent       boolean NOT NULL DEFAULT false,
  status          text NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo', 'em_analise', 'resolvido', 'arquivado')),
  admin_notes     text,                              -- internal notes from company admin
  created_at      timestamptz NOT NULL DEFAULT now()
  -- NO user_id, NO session_id, NO IP — true anonymity
);

CREATE INDEX b2b_anon_reports_company_idx ON b2b_anonymous_reports(company_id);
CREATE INDEX b2b_anon_reports_type_idx ON b2b_anonymous_reports(report_type);
CREATE INDEX b2b_anon_reports_urgent_idx ON b2b_anonymous_reports(is_urgent) WHERE is_urgent = true;
```

### Extend Existing Tables

```sql
-- Extend companies with NR-1 editable fields
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS nr1_process_descriptions  jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nr1_activities            jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nr1_preventive_measures   jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sst_responsible_name      text,
  ADD COLUMN IF NOT EXISTS sst_responsible_role      text;

COMMENT ON COLUMN companies.nr1_process_descriptions IS 'NR-1 field (a): process descriptions per department, keyed by dept name';
COMMENT ON COLUMN companies.nr1_activities IS 'NR-1 field (b): activity descriptions per department, keyed by dept name';
COMMENT ON COLUMN companies.nr1_preventive_measures IS 'NR-1 field (f): array of preventive measures already in place';
COMMENT ON COLUMN companies.sst_responsible_name IS 'SST responsible for signing NR-1 documents';

-- Extend mental_health_evaluations for preliminary report + B2C consent
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS report_type               text DEFAULT 'clinical'
    CHECK (report_type IN ('clinical', 'preliminary')),
  ADD COLUMN IF NOT EXISTS preliminary_report_markdown text,
  ADD COLUMN IF NOT EXISTS preliminary_pdf_url        text,
  ADD COLUMN IF NOT EXISTS b2c_consent               boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2c_consent_at            timestamptz;

COMMENT ON COLUMN mental_health_evaluations.report_type IS 'clinical (B2C full report) or preliminary (B2B short report)';
COMMENT ON COLUMN mental_health_evaluations.b2c_consent IS 'LGPD: employee consented to data reuse for individual B2C consultation';

-- Extend companies with Emergency SOP storage
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS emergency_sop_urls        jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN companies.emergency_sop_urls IS 'Array of {name, url, uploaded_at} for Kit de Emergencia Psicossocial SOPs';
```

### Score Schema Extension

The `scores` jsonb field on `mental_health_evaluations` currently stores:
```json
{ "phq9": 8, "gad7": 12, "isi": 14, "mbi": 52, "pss10": 22, ... }
```

After SRQ-20 and AEP are added, B2B evaluations will also include:
```json
{
  "srq20": 9,
  "aep_total": 28,
  "aep_pressure": 8,
  "aep_autonomy": 3,
  "aep_breaks": 5,
  "aep_relationships": 4,
  "aep_cognitive": 6,
  "aep_environment": 2
}
```

No schema migration needed — `scores` is already jsonb. The API aggregation logic and `riskUtils.ts` need to be updated to include these new keys.

---

## 8. API Endpoints

### New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/b2b/[companyId]/gro` | B2B user | GRO Psicossocial: scale averages, AEP dimensions, SRQ-20 distribution, probability x severity matrix |
| `GET` | `/api/b2b/[companyId]/action-plans` | B2B user | List action plan items for company (filterable by cycle, status) |
| `POST` | `/api/b2b/[companyId]/action-plans` | B2B user | Create action plan item |
| `PATCH` | `/api/b2b/[companyId]/action-plans/[planId]` | B2B user | Update action plan item (status, fields) |
| `DELETE` | `/api/b2b/[companyId]/action-plans/[planId]` | B2B user | Delete action plan item |
| `GET` | `/api/b2b/[companyId]/events` | B2B user | List events with KPI aggregation (afastamentos, dias perdidos, relatos) |
| `POST` | `/api/b2b/[companyId]/events` | B2B user | Create event (afastamento, relato, etc.) |
| `PATCH` | `/api/b2b/[companyId]/events/[eventId]` | B2B user | Update event |
| `DELETE` | `/api/b2b/[companyId]/events/[eventId]` | B2B user | Delete event |
| `GET` | `/api/b2b/[companyId]/anonymous-reports` | B2B user | Aggregated anonymous reports (by type, urgency, department) |
| `POST` | `/api/b2b/anonymous-submit` | **None** (public, rate-limited) | Submit anonymous employee report |
| `GET` | `/api/b2b/[companyId]/employee-tracking` | B2B user | Per-employee completion status (started vs completed) |
| `POST` | `/api/b2b/[companyId]/nr1-inventory` | B2B user | Generate NR-1 inventory PDF from assessment data + company fields |
| `GET` | `/api/b2b/[companyId]/nr1-inventory` | B2B user | Download latest generated NR-1 inventory PDF |

### Modified Endpoints

| Method | Path | Change |
|--------|------|--------|
| `GET` | `/api/b2b/[companyId]/overview` | Add SRQ-20 average, AEP average, active alerts count to response |
| `GET` | `/api/b2b/[companyId]/departments` | Add per-instrument averages (PHQ-9, GAD-7, SRQ-20, AEP) per department |
| `GET` | `/api/b2b/[companyId]/compliance` | Full rewrite — compute real checklist from system data, replace hardcoded items |
| `GET` | `/api/b2b/[companyId]/domains` | Add SRQ-20 and AEP to domain list |
| `POST` | `/api/assessment/submit` | If `company_id` present → set `report_type = 'preliminary'`, trigger B2B pipeline |
| `POST` | `/api/assessment/continue-report` | Add `phase: 'b2b'` handler → `runPreliminaryReport()` |
| `PATCH` | `/api/portal/companies/[id]` | Accept NR-1 fields (nr1_process_descriptions, nr1_activities, nr1_preventive_measures, sst_responsible) |

---

## 9. NR-1 Compliance Computation

The Compliance tab currently has 9 hardcoded items. The real NR-1 checklist has 17 items (from the `guia_nr1_30dias` PDF, page 10). Each item's status should be computed from system data:

| # | NR-1 Requirement | Ref | How to Compute Status |
|---|------------------|-----|----------------------|
| 1 | PGR contains risk inventory | 1.5.7.1.a | `b2b_action_plans.count > 0` AND `companies.nr1_process_descriptions IS NOT NULL` |
| 2 | PGR contains action plan | 1.5.7.1.b | `b2b_action_plans.count > 0` |
| 3 | Inventory includes psychosocial factors | 1.5.3.1.4 | `mental_health_evaluations` with SRQ-20/AEP scores exist for company |
| 4 | Inventory has 9 mandatory fields | 1.5.7.3.2 | All 3 company input fields filled + evaluations exist |
| 5 | NR-17 conditions considered (AEP) | 1.5.3.2.1 | AEP scores exist in evaluations |
| 6 | Risk classification with levels | 1.5.4.4.2 | Risk distribution computed (existing) |
| 7 | Grading criteria documented | 1.5.4.4.2.2 | Static — always conforme (methodology is built into BrightMonitor) |
| 8 | Action plan with timeline + responsible | 1.5.5.2.2 | `b2b_action_plans` with deadline + responsible filled |
| 9 | Action plan with result measurement | 1.5.5.2.2 | `b2b_action_plans` with status tracking |
| 10 | Documents dated and signed | 1.5.7.2 | `companies.gro_issued_at IS NOT NULL` |
| 11 | PGR available to workers | 1.5.7.2.1 | Static — conforme (portal do colaborador exists) |
| 12 | Worker participation mechanism | 1.5.3.3.a | `b2b_anonymous_reports.count > 0` OR canal configured |
| 13 | Worker perception consulted | 1.5.3.3.b | SRQ-20 and AEP administered (evaluations exist) |
| 14 | Risks communicated to workers | 1.5.3.3.c | Static — employees receive preliminary report |
| 15 | Emergency response procedures | 1.5.6.1 | Kit de Emergencia SOPs uploaded to Supabase storage + viewable in platform. The client provided 4 SOPs in `BrightMonitor_Kit_Emergencia_Psicossocial.pdf` — these need to be stored and accessible via the Compliance or Settings tab. |
| 16 | 20-year data retention | 1.5.7.3.3.1 | **Separate scope.** Show as "Pendente" in compliance tab. Supabase is on AWS; retention policy is infrastructure work. |
| 17 | Accident/disease analysis documented | 1.5.5.5 | `b2b_events` with `event_type = 'afastamento'` exist |

---

## 10. Integration Points

| Integration | File | Change |
|-------------|------|--------|
| Assessment form steps | `features/assessment/components/AssessmentPage.tsx` | Add SRQ-20 and AEP steps (conditional on `companyContext`) |
| Assessment step config | `features/assessment/components/constants/steps.ts` | Add step definitions for SRQ-20, AEP |
| Score computation | `features/assessment/helpers/compute-scores.ts` | Add `scoreSRQ20()` and `scoreAEP()` |
| Scale constants | `features/assessment/components/constants/scales/index.ts` | Export new scale files |
| Scoring ranges | `features/assessment/components/constants/scoring-ranges.ts` | Add SRQ-20 and AEP interpretation ranges |
| Domain mapping | `features/b2b-dashboard/constants/domain-mapping.ts` | Add SRQ-20 and AEP display names + max scores |
| Risk utilities | `app/api/b2b/lib/riskUtils.ts` | Add `srq20`, `aep_total` to `SCALE_MAX` and `DOMAIN_KEYS` |
| Report prompt data | `features/assessment/helpers/build-report-prompt-data.ts` (or inline in generate-report-background) | Include SRQ-20 + AEP scores in prompt data for preliminary report |
| Dashboard shell | `features/b2b-dashboard/components/B2BDashboardComponent.tsx` | Remap tab array to new 9-tab structure |
| Submit pipeline | `app/api/assessment/submit/route.ts` | Branch on `company_id` → set `report_type = 'preliminary'` |
| Continue-report | `app/api/assessment/continue-report/route.ts` | Add `phase: 'b2b'` case |
| Company admin | `app/api/portal/companies/[id]/route.ts` | Accept NR-1 fields on PATCH |

---

## 11. Implementation Phases

### Phase 1 — Database Migrations (Wave 0)
- [ ] Create `b2b_action_plans` table
- [ ] Create `b2b_events` table
- [ ] Create `b2b_anonymous_reports` table
- [ ] Extend `companies` with NR-1 fields
- [ ] Extend `mental_health_evaluations` with `report_type`, `preliminary_report_markdown`, `preliminary_pdf_url`
- [ ] Create all indexes
- [ ] Create Supabase storage bucket `nr1-inventories`

### Phase 2 — Assessment Instruments: SRQ-20 + AEP (Wave 1)
- [ ] Create `scales/srq20.ts` with 20 questions
- [ ] Create `scales/aep.ts` with 15 questions across 6 dimensions
- [ ] Create `SRQ20Step.tsx` component
- [ ] Create `AEPStep.tsx` component
- [ ] Update `assessment.interface.ts` — add `srq20`, `aep_*` fields to `AssessmentFormData`
- [ ] Update `compute-scores.ts` — add `scoreSRQ20()`, `scoreAEP()`
- [ ] Update `scoring-ranges.ts` — add SRQ-20 and AEP ranges
- [ ] Update `AssessmentPage.tsx` — conditionally show SRQ-20 + AEP steps for B2B
- [ ] Update `riskUtils.ts` — add to `SCALE_MAX`, `DOMAIN_KEYS`
- [ ] Update `domain-mapping.ts` — add display names + max scores
- [ ] **BLOCKER**: Need actual SRQ-20 Portuguese questions and AEP questions from client's clinical team

### Phase 3 — Preliminary Report AI Pipeline (Wave 1, parallel)
- [ ] Create `b2b-report-prompts.ts` — `B2B_PRELIMINARY_SYSTEM`, `B2B_PRELIMINARY_USER_PREFIX`
- [ ] Add `runPreliminaryReport()` to `generate-report-background.ts`
- [ ] Create `preliminary-pdf-helpers.ts` — `buildPreliminaryPdf()` with lighter template
- [ ] Modify `submit/route.ts` — set `report_type = 'preliminary'` for B2B
- [ ] Modify `continue-report/route.ts` — add `phase: 'b2b'` handler
- [ ] Modify `send-email.ts` — add `assessment_preliminary_report_ready` webhook event
- [ ] Update Vercel config if needed for function duration

### Phase 4 — New CRUD APIs (Wave 2)
- [ ] `GET/POST /api/b2b/[companyId]/action-plans` + `PATCH/DELETE .../[planId]`
- [ ] `GET/POST /api/b2b/[companyId]/events` + `PATCH/DELETE .../[eventId]`
- [ ] `GET /api/b2b/[companyId]/anonymous-reports`
- [ ] `POST /api/b2b/anonymous-submit` (public, rate-limited)
- [ ] `GET /api/b2b/[companyId]/employee-tracking`
- [ ] `GET /api/b2b/[companyId]/gro`
- [ ] All use `getB2BUser()` auth pattern (except anonymous-submit)

### Phase 5 — Modified Aggregation APIs (Wave 2, parallel)
- [ ] Modify `overview/route.ts` — include SRQ-20/AEP aggregation
- [ ] Modify `departments/route.ts` — per-instrument averages per department
- [ ] Modify `domains/route.ts` — add SRQ-20 and AEP domains
- [ ] Rewrite `compliance/route.ts` — compute 17-item checklist from real system data

### Phase 6 — Dashboard UI: Existing Tabs Rewrite (Wave 3)
- [ ] Rewrite `B2BOverviewTab.tsx` — match new HTML (KPI strip, monthly evolution, inline alerts)
- [ ] Create `B2BSetoresTab.tsx` — per-sector table with PHQ-9, GAD-7, SRQ-20, AEP columns, sortable
- [ ] Rewrite `B2BComplianceTab.tsx` — 17-item computed checklist, real timeline, real legal docs
- [ ] Modify `B2BReportsTab.tsx` — add NR-1 inventory generation button
- [ ] Modify `B2BSettingsTab.tsx` — add NR-1 editable fields section

### Phase 7 — Dashboard UI: New Tabs (Wave 3, parallel)
- [ ] Create `B2BGROTab.tsx` — radar chart, AEP dimensions, SRQ-20 distribution, risk matrix
- [ ] Create `B2BActionPlanTab.tsx` — PDCA CRUD interface with status counters
- [ ] Create `B2BEventsTab.tsx` — event diary with KPI cards, CID code reference
- [ ] Create `B2BCanalAnonimoTab.tsx` — aggregated view with donut chart, correlation analysis
- [ ] Create `B2BEmployeeTrackingComponent.tsx` — completion tracking table
- [ ] Create `B2BNR1FieldsComponent.tsx` — editable company NR-1 fields
- [ ] Update `B2BDashboardComponent.tsx` — new 9-tab structure
- [ ] Create all TanStack Query hooks (useB2BGRO, useB2BActionPlans, useB2BEvents, etc.)

### Phase 8 — NR-1 Inventory PDF Generation (Wave 4)
- [ ] Create `/api/b2b/[companyId]/nr1-inventory/route.ts`
- [ ] Compute 6 fields from assessment data (perigos, agravos, grupos expostos, exposicao, analise preliminar, classificacao)
- [ ] Pull 3 fields from company NR-1 data (processos, atividades, medidas)
- [ ] Generate PDF with legal formatting using jspdf
- [ ] Upload to `nr1-inventories` storage bucket
- [ ] Wire download into Reports tab

### Phase 9 — Anonymous Channel Employee Form (Wave 4, parallel)
- [ ] Create `/avaliacao/canal/page.tsx` — public anonymous form
- [ ] Style matching assessment dark theme
- [ ] Terms of anonymity checkbox
- [ ] Rate limiting on API endpoint
- [ ] Success confirmation page

---

## 12. Open Questions

### Resolved (from client call + discussion)

| # | Question | Resolution |
|---|----------|------------|
| R1 | Who manages action plans? | Both company admin (HR) and Bright Brains admin (portal). Client stated they want plans generated via templates or AI. |
| R2 | Action plan generation method? | Phased: Phase 1 = manual CRUD, Phase 2 = template-based rules, Phase 3 = AI suggestions. Client is cost-sensitive. |
| R3 | 20-year data retention? | **Separate scope.** Supabase is already on AWS. Will be addressed as infrastructure project. Compliance tab shows "Pendente". |
| R4 | Emergency SOPs? | Must be in the platform — accessible via Compliance or Settings. Upload to Supabase storage + viewable/downloadable. |
| R5 | NR-1 Inventory? | Core product. Non-negotiable. The whole point of BrightMonitor is NR-1 compliance. |
| R6 | Employee dashboard/portal? | Not needed. Employees don't need a persistent view. Their touchpoints: assessment form → preliminary report → anonymous channel → B2C CTA. |
| R7 | eSocial? | **Excluded.** Compliance tab shows "Futuro" not "Conforme". |

### Still Open (NEED client answers)

1. **SRQ-20 questions** (BLOCKER): The WHO SRQ-20 has a standard Portuguese version (Mari & Williams, 1986). Does the client want the standard WHO version, or a customized version? Who provides the final question text and scoring cutoffs?

2. **AEP questions** (BLOCKER): The PDFs describe 6 dimensions with 15 questions. The actual question text does not exist in any document provided. Who writes these — Dra. Soraya? **Without these questions, we cannot build the AEP form, and without the AEP, 4 of 7 dashboard tabs have no data to show.**

3. **Risk matrix algorithm**: The probability x severity matrix in the GRO tab maps scores to a 3x4 grid. What is the exact algorithm? How do individual scale scores map to "probability" (Baixa/Media/Alta) and "severity" (Baixa/Moderada/Alta/Muito Alta)? This needs clinical validation from Dra. Soraya.

4. **Benchmark data**: The GRO tab shows "Benchmark Setor (Tech)" comparison. Does Bright Brains have actual industry benchmarks? Recommendation: show "–" for MVP, compute internal benchmarks when sample size > 500 evaluations per industry.

5. **Canal Anonimo access**: How do employees access the anonymous form? Options: (a) Direct URL provided by company, (b) QR code poster in workplace, (c) Link in the preliminary report PDF. All three can work simultaneously.

6. **NR-1 Inventory signing**: Is a text field for SST responsible name sufficient, or does the client expect ICP-Brasil digital signature integration? Recommendation: text field for MVP.

7. **Events data source**: Will HR manually enter afastamentos (sick leaves) in our platform? Or do they expect integration with their HR system (Totvs, SAP, etc.)? Manual entry is Phase 1; integrations are a separate project.

8. **Nexo causal correlation**: Is the event-to-risk correlation manual (admin classifies) or automatic (system correlates)? Recommendation: simple rule-based correlation (relato tipo X from setor Y where score Z is elevated → auto-tag).

9. **Preliminary report delivery**: The v1 scope says (a) shown on screen, (b) downloadable PDF, (c) sent by email. Should all three be in scope? Email requires n8n webhook extension.

10. **Action plan templates content**: If we do template-based generation (Phase 2), who writes the templates? Examples: "For departments with GAD-7 avg > 10 → recommend: structured anxiety management program, 8 sessions, led by occupational psychologist." Does the client's clinical team provide these, or do we write them?

11. **B2B → B2C consent mechanism**: At what point does the employee consent to data reuse? Options: (a) Checkbox at end of assessment, (b) CTA in preliminary report with consent form, (c) Separate consent flow when employee contacts Bright Brains. Recommendation: checkbox at end of assessment (simplest, highest conversion).

12. **Deadline**: Is 26 May 2026 (NR-1 enforcement) a hard deadline? If yes, we need to cut scope to: SRQ-20 + AEP + preliminary report + compliance tab rewrite + NR-1 inventory PDF. Action plans, events, and anonymous channel would be Phase 2 (post-enforcement).

13. **Onboarding threshold**: What minimum completion % should trigger the dashboard activation? Suggestion: 30%. Below this, the admin sees a tracking/onboarding view instead of empty charts.

14. **Email reminders**: Should the platform send reminder emails to employees who haven't started/completed the assessment? Or does the company handle communications via their own channels (email, Slack, intranet)?

15. **B2B form length** (BLOCKER): Should B2B employees fill the full Adulto form (~25 steps, 12 clinical scales — same as B2C) or a reduced NR-1 form (~15 steps: demographics + SRQ-20 + AEP + PHQ-9, GAD-7, MBI, PSS-10)? Full form = richer data for B2C conversion but lower completion rate.

16. **B2B report type** (BLOCKER): After assessment, B2B currently generates the same 15-page clinical report as B2C. Should B2B employees receive only the preliminary report (1-2 pages), or both? Generating both is expensive.

17. **Reports tab — which reports matter?**: The Reports tab has 5 regulatory report types (GRO Consolidado, Executivo, por Departamento, Laudo CFM, CIAT) — all non-functional. Which ones are needed for NR-1 compliance? Which can wait?

18. **GRO Consolidado format**: Is the GRO Consolidado PDF simply the dashboard data exported to PDF? Or does it have a specific legal structure with mandatory fields and signature areas?

19. **CSV/Excel exports**: Are data exports needed in the initial scope? If yes, which data should be exportable?

### Scope Tiers (for quoting)

Given the client's cost sensitivity, we propose three tiers:

| Tier | What's Included | Purpose |
|------|----------------|---------|
| **MVP (NR-1 Minimum)** | SRQ-20 + AEP in assessment, preliminary report, compliance tab rewrite, NR-1 inventory PDF, employee tracking + onboarding flow, B2C consent checkbox | Legally compliant — the company can pass a labor audit |
| **Standard** | MVP + Setores tab rewrite, GRO tab, anonymous channel, events (manual entry), Reports tab rebuild (GRO PDF + CSV exports) | Full dashboard as shown in client HTML |
| **Premium** | Standard + action plan with template generation, correlations, advanced reporting, all 5 regulatory report types | Automated insights and recommendations |
