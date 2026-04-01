# BrightMonitor NR-1 — Phase 1: Database Migrations + File Scaffolding

**Cursor Agent:** /db-engineer
**Wave:** 0
**Objective:** Create all new database tables, extend existing tables, create storage buckets, and scaffold empty files for all subsequent phases.
**Depends on:** None

**Files owned by this phase:**
- `frontend/AI_CONTEXT/database/bright_brains_tables.sql` (append new table definitions)

---

## 1. Files to Create

This phase modifies the schema documentation file and runs migrations via Supabase MCP.

## 2. What to Build

### 2a. New Tables

Run the following SQL via Supabase MCP (or migration):

**`b2b_action_plans`** — PDCA items per company/cycle.

```sql
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
  ai_generated    boolean NOT NULL DEFAULT false,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_action_plans_company_idx ON b2b_action_plans(company_id);
CREATE INDEX b2b_action_plans_cycle_idx ON b2b_action_plans(cycle_id);
CREATE INDEX b2b_action_plans_status_idx ON b2b_action_plans(status);
```

**`b2b_events`** — Incidents, sick leaves, CID-10 tracking.

```sql
CREATE TABLE b2b_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_date      date NOT NULL,
  event_type      text NOT NULL
    CHECK (event_type IN ('afastamento', 'relato_canal', 'acidente', 'outro')),
  cid_code        text,
  description     text NOT NULL,
  department      text,
  days_lost       integer,
  source          text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'pdf_import', 'form')),
  notes           text,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_events_company_idx ON b2b_events(company_id);
CREATE INDEX b2b_events_date_idx ON b2b_events(event_date);
CREATE INDEX b2b_events_type_idx ON b2b_events(event_type);
```

**`b2b_percepcao_reports`** — Canal de Percepção + AEP Q15 responses.

```sql
CREATE TABLE b2b_percepcao_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id        uuid REFERENCES assessment_cycles(id),
  evaluation_id   uuid REFERENCES mental_health_evaluations(id),
  report_type     text NOT NULL
    CHECK (report_type IN ('estresse', 'sobrecarga', 'assedio_moral', 'assedio_sexual',
      'conflito', 'condicoes_fisicas', 'falta_recursos', 'discriminacao', 'outro')),
  urgencia        text NOT NULL DEFAULT 'registro'
    CHECK (urgencia IN ('urgente', 'registro')),
  frequencia      text,
  department      text,
  impacto         text,
  descricao       text NOT NULL,
  sugestao        text,
  source          text NOT NULL DEFAULT 'form'
    CHECK (source IN ('form', 'aep_q15')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_percepcao_company_idx ON b2b_percepcao_reports(company_id);
CREATE INDEX b2b_percepcao_type_idx ON b2b_percepcao_reports(report_type);
CREATE INDEX b2b_percepcao_urgent_idx ON b2b_percepcao_reports(urgencia) WHERE urgencia = 'urgente';
```

### 2b. Extend Existing Tables

**`companies`** — Add NR-1 fields.

```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS nr1_process_descriptions  jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nr1_activities            jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nr1_preventive_measures   jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sst_responsible_name      text,
  ADD COLUMN IF NOT EXISTS sst_responsible_role      text,
  ADD COLUMN IF NOT EXISTS sst_signature_url         text,
  ADD COLUMN IF NOT EXISTS emergency_sop_urls        jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cnae                      text,
  ADD COLUMN IF NOT EXISTS risk_grade                text;
```

**`mental_health_evaluations`** — Add laudo + consent columns.

```sql
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS report_type               text DEFAULT 'clinical',
  ADD COLUMN IF NOT EXISTS laudo_markdown            text,
  ADD COLUMN IF NOT EXISTS laudo_pdf_url             text,
  ADD COLUMN IF NOT EXISTS b2c_consent               boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2c_consent_at            timestamptz,
  ADD COLUMN IF NOT EXISTS b2c_contact_consent       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2c_contact_consent_at    timestamptz,
  ADD COLUMN IF NOT EXISTS b2b_anonymized_consent    boolean DEFAULT false;
```

Add check constraint separately (safe for existing data):
```sql
ALTER TABLE mental_health_evaluations
  ADD CONSTRAINT mental_health_evaluations_report_type_check
  CHECK (report_type IN ('clinical', 'b2b-laudo'));
```

### 2c. Storage Buckets

Create via Supabase dashboard or MCP:

1. `nr1-inventories` — private, 50MB max file size
2. `company-documents` — private, 50MB max file size
3. `company-signatures` — private, 5MB max file size

### 2d. Update Schema Documentation

Append the new table definitions to `frontend/AI_CONTEXT/database/bright_brains_tables.sql` for context.

## 3. Phase Completion Checklist

- [ ] Table created: `b2b_action_plans`
- [ ] Table created: `b2b_events`
- [ ] Table created: `b2b_percepcao_reports`
- [ ] Columns added to `companies` (9 new columns)
- [ ] Columns added to `mental_health_evaluations` (7 new columns)
- [ ] Indexes created on all new tables
- [ ] Storage bucket created: `nr1-inventories`
- [ ] Storage bucket created: `company-documents`
- [ ] Storage bucket created: `company-signatures`
- [ ] `bright_brains_tables.sql` updated with new schema

**Next:** `PHASE_2_nr1_b2b_assessment_form.md` — B2B assessment form steps (SRQ-20, AEP, Canal, Consents)
