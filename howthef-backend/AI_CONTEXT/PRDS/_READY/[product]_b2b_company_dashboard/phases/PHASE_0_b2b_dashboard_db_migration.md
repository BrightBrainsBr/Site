# Bright Precision B2B Company Dashboard — Phase 0: Database Migration

**Cursor Agent:** /db-engineer
**Wave:** 0
**Objective:** Create all B2B tables, extend mental_health_evaluations, add indexes and RLS.
**Depends on:** None

**Files owned by this phase:**
- (Migration file — apply via Supabase migrations or SQL script)

---

## 1. Files to Create

No application files. This phase produces a single migration script to be applied to Supabase.

---

## 2. What to Build

Create a migration that:

1. Creates `companies` table
2. Creates `assessment_cycles` table with indexes and unique constraint for `is_current`
3. Creates `company_users` table with indexes
4. Creates `company_access_codes` table with indexes
5. Alters `mental_health_evaluations` to add `company_id`, `employee_department`, `cycle_id`
6. Creates indexes on `mental_health_evaluations` for `company_id` and `cycle_id`
7. Enables RLS on `company_users` and creates the SELECT policy

---

## 3. Database Migration

```sql
-- Migration: B2B Company Dashboard schema
-- Run as single transaction

-- 1. companies
CREATE TABLE companies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  cnpj             text UNIQUE,
  contact_email    text,
  active           boolean NOT NULL DEFAULT true,
  gro_issued_at    timestamptz,
  gro_valid_until  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 2. assessment_cycles
CREATE TABLE assessment_cycles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  label        text NOT NULL,
  starts_at    date NOT NULL,
  ends_at      date NOT NULL,
  is_current   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cycles_company_idx ON assessment_cycles(company_id);
CREATE UNIQUE INDEX cycles_one_current ON assessment_cycles(company_id) WHERE is_current = true;

-- 3. company_users
CREATE TABLE company_users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'viewer',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
CREATE INDEX company_users_user_idx ON company_users(user_id);
CREATE INDEX company_users_company_idx ON company_users(company_id);

-- 4. company_access_codes
CREATE TABLE company_access_codes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id                uuid NOT NULL REFERENCES assessment_cycles(id),
  code                    text UNIQUE NOT NULL,
  department              text,
  employee_email          text,
  started_at              timestamptz,
  used_at                 timestamptz,
  used_by_evaluation_id   uuid REFERENCES mental_health_evaluations(id),
  active                  boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_access_codes_code_idx ON company_access_codes(code);
CREATE INDEX company_access_codes_company_idx ON company_access_codes(company_id);

-- 5. Extend mental_health_evaluations (add columns if not exist)
ALTER TABLE mental_health_evaluations
  ADD COLUMN IF NOT EXISTS company_id          uuid REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS employee_department text,
  ADD COLUMN IF NOT EXISTS cycle_id           uuid REFERENCES assessment_cycles(id);

-- 6. Indexes on mental_health_evaluations
CREATE INDEX IF NOT EXISTS mhe_company_id_idx ON mental_health_evaluations(company_id);
CREATE INDEX IF NOT EXISTS mhe_cycle_id_idx   ON mental_health_evaluations(cycle_id);

-- 7. RLS on company_users
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own company memberships" ON company_users;
CREATE POLICY "Users see own company memberships"
  ON company_users FOR SELECT USING (auth.uid() = user_id);
```

**Note:** The `company_access_codes` table references `mental_health_evaluations(id)`. If your Postgres version does not support `ADD COLUMN IF NOT EXISTS`, run the ALTER statements without that clause and handle existing columns manually.

---

## 4. Integration Points

None. This phase is standalone. Subsequent phases depend on these tables existing.

---

## 5. Phase Completion Checklist

- [ ] Migration script created and saved to project migrations folder
- [ ] Migration applied to Supabase (local/staging/production as appropriate)
- [ ] Verify: `companies`, `assessment_cycles`, `company_users`, `company_access_codes` exist
- [ ] Verify: `mental_health_evaluations` has `company_id`, `employee_department`, `cycle_id`
- [ ] Verify: RLS policy on `company_users` allows SELECT for `auth.uid() = user_id`

**Next:** `PHASE_1_b2b_dashboard_assessment_stamping.md` — Modify validate-code, create pre-register, modify submit
