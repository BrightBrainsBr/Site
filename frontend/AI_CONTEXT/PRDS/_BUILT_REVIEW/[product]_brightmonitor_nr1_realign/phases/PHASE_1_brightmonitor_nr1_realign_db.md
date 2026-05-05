# BrightMonitor NR-1 — Phase 1: Database Realignment

**Cursor Agent:** /db-engineer
**Wave:** 0
**Objective:** Add ~40 NR-1 columns to `mental_health_evaluations`, add `bright_insights_enabled` to `companies`, create `harassment_reports` table, and verify existing tables (`b2b_action_plans`, `b2b_events`, `b2b_percepcao_reports`) match expected schemas.
**Depends on:** None

**Files owned by this phase:**
- `frontend/AI_CONTEXT/database/bright_brains_tables.sql` (append new definitions)
- Database migrations via Supabase MCP

---

## 1. Files to Create

No application files. This phase runs SQL migrations against Supabase.

## 2. What to Build

### Step 1: Verify Existing Schema

Before running any migration, query live Supabase to confirm current state:

```sql
-- Check what columns exist on mental_health_evaluations
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'mental_health_evaluations'
ORDER BY ordinal_position;

-- Check if tables from archived PRD exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('b2b_action_plans', 'b2b_events', 'b2b_percepcao_reports', 'harassment_reports');

-- Check companies columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;
```

If `b2b_action_plans`, `b2b_events`, or `b2b_percepcao_reports` do NOT exist, run the archived Phase 1 migration SQL (from `_ARCHIVE/[product]/[product]_b2b_nr1_compliance/phases/PHASE_1_nr1_database_migrations.md`).

### Step 2: Add NR-1 Columns to `mental_health_evaluations`

```sql
ALTER TABLE mental_health_evaluations

  -- Perfil
  ADD COLUMN IF NOT EXISTS nr1_role TEXT,
  ADD COLUMN IF NOT EXISTS nr1_work_time TEXT,

  -- Físico (Likert 1-5)
  ADD COLUMN IF NOT EXISTS noise_level SMALLINT,
  ADD COLUMN IF NOT EXISTS temperature_level SMALLINT,
  ADD COLUMN IF NOT EXISTS lighting_level SMALLINT,
  ADD COLUMN IF NOT EXISTS vibration_level SMALLINT,
  ADD COLUMN IF NOT EXISTS humidity_level SMALLINT,

  -- Químico
  ADD COLUMN IF NOT EXISTS chemical_exposures TEXT[],
  ADD COLUMN IF NOT EXISTS chemical_details TEXT,

  -- Biológico
  ADD COLUMN IF NOT EXISTS biological_exposures TEXT[],
  ADD COLUMN IF NOT EXISTS biological_details TEXT,

  -- Ergonômico (Likert 1-5)
  ADD COLUMN IF NOT EXISTS posture_level SMALLINT,
  ADD COLUMN IF NOT EXISTS repetition_level SMALLINT,
  ADD COLUMN IF NOT EXISTS manual_force_level SMALLINT,
  ADD COLUMN IF NOT EXISTS breaks_level SMALLINT,
  ADD COLUMN IF NOT EXISTS screen_level SMALLINT,
  ADD COLUMN IF NOT EXISTS mobility_level SMALLINT,
  ADD COLUMN IF NOT EXISTS cognitive_effort_level SMALLINT,

  -- Psicossocial (Likert 1-5)
  ADD COLUMN IF NOT EXISTS workload_level SMALLINT,
  ADD COLUMN IF NOT EXISTS pace_level SMALLINT,
  ADD COLUMN IF NOT EXISTS autonomy_level SMALLINT,
  ADD COLUMN IF NOT EXISTS leadership_level SMALLINT,
  ADD COLUMN IF NOT EXISTS relationships_level SMALLINT,
  ADD COLUMN IF NOT EXISTS recognition_level SMALLINT,
  ADD COLUMN IF NOT EXISTS clarity_level SMALLINT,
  ADD COLUMN IF NOT EXISTS balance_level SMALLINT,
  ADD COLUMN IF NOT EXISTS violence_level SMALLINT,
  ADD COLUMN IF NOT EXISTS harassment_level SMALLINT,

  -- Acidentes
  ADD COLUMN IF NOT EXISTS had_accident BOOLEAN,
  ADD COLUMN IF NOT EXISTS accident_description TEXT,
  ADD COLUMN IF NOT EXISTS had_near_miss BOOLEAN,
  ADD COLUMN IF NOT EXISTS near_miss_description TEXT,
  ADD COLUMN IF NOT EXISTS had_work_disease BOOLEAN,
  ADD COLUMN IF NOT EXISTS work_disease_description TEXT,

  -- Percepção
  ADD COLUMN IF NOT EXISTS satisfaction_level SMALLINT,
  ADD COLUMN IF NOT EXISTS biggest_risk TEXT,
  ADD COLUMN IF NOT EXISTS suggestion TEXT,

  -- Computed domain scores (1.00-5.00)
  ADD COLUMN IF NOT EXISTS score_physical NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_ergonomic NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_psychosocial NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_violence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS score_overall NUMERIC(3,2),

  -- Assessment classification
  ADD COLUMN IF NOT EXISTS assessment_kind TEXT NOT NULL DEFAULT 'nr1';

-- Add check constraint for assessment_kind
DO $$
BEGIN
  ALTER TABLE mental_health_evaluations
    ADD CONSTRAINT mental_health_evaluations_assessment_kind_check
    CHECK (assessment_kind IN ('nr1', 'insights', 'clinical'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Index for NR-1 assessments (dashboard queries filter on this)
CREATE INDEX IF NOT EXISTS idx_mhe_assessment_kind
  ON mental_health_evaluations(assessment_kind)
  WHERE assessment_kind = 'nr1';

-- Index for domain score aggregation queries
CREATE INDEX IF NOT EXISTS idx_mhe_company_cycle_kind
  ON mental_health_evaluations(company_id, cycle_id, assessment_kind);
```

### Step 3: Add `bright_insights_enabled` to `companies`

```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS bright_insights_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN companies.bright_insights_enabled
  IS 'Feature flag: when true, NR-1 form appends clinical scales (PHQ-9, GAD-7, ISI, MBI) and dashboard shows Insights tab';
```

### Step 4: Create `harassment_reports` Table

```sql
CREATE TABLE IF NOT EXISTS harassment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES assessment_cycles(id),
  department TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE harassment_reports
  IS 'Anonymous harassment reports from NR-1 Acidentes step. No employee_id, no assessment_id — anonymity is structural.';

CREATE INDEX IF NOT EXISTS idx_harassment_reports_company
  ON harassment_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_harassment_reports_cycle
  ON harassment_reports(cycle_id);

-- RLS
ALTER TABLE harassment_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (submit endpoint uses service role, but this is safe)
CREATE POLICY IF NOT EXISTS harassment_reports_insert_policy
  ON harassment_reports FOR INSERT WITH CHECK (true);

-- Company users can read their own company's reports (API further restricts to aggregates only)
CREATE POLICY IF NOT EXISTS harassment_reports_select_policy
  ON harassment_reports FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );
```

### Step 5: Verify `b2b_events` Schema

The existing `b2b_events` table should already have:
- `id`, `company_id`, `event_date`, `event_type`, `cid_code`, `description`, `department`, `days_lost`, `source`, `notes`, `created_by`, `created_at`, `updated_at`

If the table doesn't exist, create it per the archived Phase 1 migration. If it exists, verify the `event_type` check constraint includes `'acidente'` (needed for NR-1 incident writes from the assessment form). Add if missing:

```sql
-- Only run if b2b_events exists but lacks the needed event types
-- Check first: SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'b2b_events'::regclass;
-- If event_type check doesn't include 'incidente', 'near_miss', 'work_disease', update:
ALTER TABLE b2b_events DROP CONSTRAINT IF EXISTS b2b_events_event_type_check;
ALTER TABLE b2b_events ADD CONSTRAINT b2b_events_event_type_check
  CHECK (event_type IN ('afastamento', 'relato_canal', 'acidente', 'incidente', 'near_miss', 'work_disease', 'atestado', 'outro'));
```

### Step 6: Update Schema Documentation

Append the new table definitions and column additions to `frontend/AI_CONTEXT/database/bright_brains_tables.sql`.

---

## 3. Database Migration

All SQL is in Step 2-5 above. Run via Supabase MCP `execute_sql` or dashboard SQL editor.

## 4. Integration Points

None. This phase only touches the database. No application files are modified.

## 5. Phase Completion Checklist

- [ ] Verified existing schema state (`\d mental_health_evaluations`, `\d companies`)
- [ ] ~40 NR-1 columns added to `mental_health_evaluations`
- [ ] `assessment_kind` column added with check constraint
- [ ] `bright_insights_enabled` column added to `companies`
- [ ] `harassment_reports` table created with indexes and RLS
- [ ] `b2b_events` event_type constraint verified/updated
- [ ] `b2b_action_plans` existence verified
- [ ] `b2b_percepcao_reports` existence verified
- [ ] `bright_brains_tables.sql` updated

**Next:** `PHASE_2_brightmonitor_nr1_realign_form.md` — NR-1 assessment form (8 step components + scoring)
