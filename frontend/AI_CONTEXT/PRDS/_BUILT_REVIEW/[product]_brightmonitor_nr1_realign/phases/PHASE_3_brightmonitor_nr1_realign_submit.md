# BrightMonitor NR-1 — Phase 3: Submit + Write Paths

**Cursor Agent:** /frontend-engineer
**Wave:** 2
**Objective:** Update the assessment submit endpoint to persist NR-1 columns to `mental_health_evaluations`, write incident rows to `b2b_events`, write anonymous harassment reports to `harassment_reports`, and conditionally trigger the b2b-laudo agent only when `bright_insights_enabled` is true.
**Depends on:** Phase 1 (DB columns exist), Phase 2 (form sends NR-1 payload)

**Files owned by this phase:**
- `frontend/app/api/assessment/submit/route.ts`

---

## 1. Files to Create

No new files. This phase modifies one existing file.

## 2. What to Build

### 2a. Extract NR-1 Fields from Payload

The submit route currently receives `formData` (the full `AssessmentFormData`) and `scores` (computed by the client). After Phase 2, B2B submissions include NR-1 fields in `formData` and NR-1 domain scores in `scores`.

Add to the destructured body:

```typescript
const {
  formData, scores, uploads,
  company_id, employee_department, cycle_id, code_id,
  b2c_consent, b2c_contact_consent, b2b_anonymized_consent,
} = body;
```

No new top-level fields needed — everything is inside `formData` and `scores`.

### 2b. Write NR-1 Columns to `mental_health_evaluations`

Extend the `insertPayload` to include NR-1 columns when the formData contains them:

```typescript
// NR-1 fields — only present for B2B NR-1 assessments
if (formData.noise_level != null) {
  // Perfil
  insertPayload.nr1_role = formData.nr1_role || null;
  insertPayload.nr1_work_time = formData.nr1_work_time || null;
  
  // Físico
  insertPayload.noise_level = formData.noise_level;
  insertPayload.temperature_level = formData.temperature_level;
  insertPayload.lighting_level = formData.lighting_level;
  insertPayload.vibration_level = formData.vibration_level;
  insertPayload.humidity_level = formData.humidity_level;
  
  // Químico / Biológico
  insertPayload.chemical_exposures = formData.chemical_exposures || [];
  insertPayload.chemical_details = formData.chemical_details || null;
  insertPayload.biological_exposures = formData.biological_exposures || [];
  insertPayload.biological_details = formData.biological_details || null;
  
  // Ergonômico
  insertPayload.posture_level = formData.posture_level;
  insertPayload.repetition_level = formData.repetition_level;
  insertPayload.manual_force_level = formData.manual_force_level;
  insertPayload.breaks_level = formData.breaks_level;
  insertPayload.screen_level = formData.screen_level;
  insertPayload.mobility_level = formData.mobility_level;
  insertPayload.cognitive_effort_level = formData.cognitive_effort_level;
  
  // Psicossocial
  insertPayload.workload_level = formData.workload_level;
  insertPayload.pace_level = formData.pace_level;
  insertPayload.autonomy_level = formData.autonomy_level;
  insertPayload.leadership_level = formData.leadership_level;
  insertPayload.relationships_level = formData.relationships_level;
  insertPayload.recognition_level = formData.recognition_level;
  insertPayload.clarity_level = formData.clarity_level;
  insertPayload.balance_level = formData.balance_level;
  insertPayload.violence_level = formData.violence_level;
  insertPayload.harassment_level = formData.harassment_level;
  
  // Acidentes (booleans + descriptions)
  insertPayload.had_accident = formData.had_accident ?? false;
  insertPayload.accident_description = formData.accident_description || null;
  insertPayload.had_near_miss = formData.had_near_miss ?? false;
  insertPayload.near_miss_description = formData.near_miss_description || null;
  insertPayload.had_work_disease = formData.had_work_disease ?? false;
  insertPayload.work_disease_description = formData.work_disease_description || null;
  
  // Percepção
  insertPayload.satisfaction_level = formData.satisfaction_level;
  insertPayload.biggest_risk = formData.biggest_risk || null;
  insertPayload.suggestion = formData.nr1_suggestion || null;
  
  // Computed domain scores
  insertPayload.score_physical = scores.score_physical ?? null;
  insertPayload.score_ergonomic = scores.score_ergonomic ?? null;
  insertPayload.score_psychosocial = scores.score_psychosocial ?? null;
  insertPayload.score_violence = scores.score_violence ?? null;
  insertPayload.score_overall = scores.score_overall ?? null;
  
  insertPayload.assessment_kind = 'nr1';
}
```

### 2c. Write Incident Rows to `b2b_events`

After the main evaluation insert, if the form reports accidents/incidents, write rows to `b2b_events`. These are best-effort writes — failure does not block the submission.

```typescript
if (company_id && formData.noise_level != null) {
  const incidentWrites: Promise<unknown>[] = [];
  
  if (formData.had_accident && formData.accident_description?.trim()) {
    incidentWrites.push(
      sb.from('b2b_events').insert({
        company_id,
        event_date: new Date().toISOString().split('T')[0],
        event_type: 'acidente',
        description: formData.accident_description.trim(),
        department: employee_department || null,
        source: 'form',
      })
    );
  }
  
  if (formData.had_near_miss && formData.near_miss_description?.trim()) {
    incidentWrites.push(
      sb.from('b2b_events').insert({
        company_id,
        event_date: new Date().toISOString().split('T')[0],
        event_type: 'near_miss',
        description: formData.near_miss_description.trim(),
        department: employee_department || null,
        source: 'form',
      })
    );
  }
  
  if (formData.had_work_disease && formData.work_disease_description?.trim()) {
    incidentWrites.push(
      sb.from('b2b_events').insert({
        company_id,
        event_date: new Date().toISOString().split('T')[0],
        event_type: 'work_disease',
        description: formData.work_disease_description.trim(),
        department: employee_department || null,
        source: 'form',
      })
    );
  }
  
  // Best-effort — log errors but don't fail the submission
  await Promise.allSettled(incidentWrites).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[submit:${requestId}] Incident write ${i} failed:`, r.reason);
      }
    });
  });
}
```

### 2d. Write Anonymous Harassment Report

If `report_harassment` is true, insert into `harassment_reports`. This write is structurally anonymous — no `evaluation_id`, no `employee_id`, no `user_id` link.

```typescript
if (company_id && formData.report_harassment && formData.harassment_report_description?.trim()) {
  await sb.from('harassment_reports').insert({
    company_id,
    cycle_id: resolvedCycleId || null,
    department: employee_department || null,
    description: formData.harassment_report_description.trim(),
  }).then(({ error: hrErr }) => {
    if (hrErr) console.error(`[submit:${requestId}] Harassment report write failed:`, hrErr);
  });
}
```

### 2e. Conditional Report Triggering

Currently, all B2B submissions trigger the `b2b-laudo` pipeline:

```typescript
phase: isB2B ? 'b2b-laudo' : 'stage1',
```

Change to only trigger the laudo when Insights is enabled. For NR-1-only assessments, no report is generated — the data persists and the dashboard reads it.

```typescript
// Determine if this B2B company has Insights enabled
let insightsEnabled = false;
if (company_id) {
  const { data: companyRow } = await sb
    .from('companies')
    .select('bright_insights_enabled')
    .eq('id', company_id)
    .maybeSingle();
  insightsEnabled = companyRow?.bright_insights_enabled === true;
}

// In the after() callback:
if (isB2B && !insightsEnabled) {
  // NR-1 only — no report generation, just mark as completed
  await setStatus('completed');
  return;
}

// Otherwise, trigger report as before
const phase = isB2B ? 'b2b-laudo' : 'stage1';
```

### 2f. Update `report_type` for NR-1 Assessments

Currently: `insertPayload.report_type = 'b2b-laudo'` for all B2B submissions.

Change: NR-1-only assessments get `report_type = 'nr1'` (no report generated). Insights-enabled assessments keep `report_type = 'b2b-laudo'`.

```typescript
if (company_id) {
  insertPayload.company_id = company_id;
  insertPayload.report_type = insightsEnabled ? 'b2b-laudo' : 'nr1';
}
```

Note: The `report_type` check constraint on `mental_health_evaluations` currently allows `('clinical', 'b2b-laudo')`. Add `'nr1'` to the constraint. This is a DB change — Phase 1 should have handled it, but if not:

```sql
ALTER TABLE mental_health_evaluations DROP CONSTRAINT IF EXISTS mental_health_evaluations_report_type_check;
ALTER TABLE mental_health_evaluations ADD CONSTRAINT mental_health_evaluations_report_type_check
  CHECK (report_type IN ('clinical', 'b2b-laudo', 'nr1'));
```

If Phase 1 didn't add this, do it via Supabase MCP in this phase.

---

## 4. Integration Points

- `frontend/app/api/assessment/submit/route.ts` — the only file modified
- Reads from `companies` table (to check `bright_insights_enabled`)
- Writes to `mental_health_evaluations` (NR-1 columns)
- Writes to `b2b_events` (incidents)
- Writes to `harassment_reports` (anonymous harassment)
- Existing `b2b-laudo` agent path untouched — it still runs when Insights is enabled

## 5. Phase Completion Checklist

- [ ] NR-1 columns written to `mental_health_evaluations` on B2B submit
- [ ] Domain scores (`score_physical`, `score_ergonomic`, etc.) persisted
- [ ] `assessment_kind = 'nr1'` set for NR-1 submissions
- [ ] Incident rows written to `b2b_events` for accident/near-miss/disease reports
- [ ] Anonymous harassment row written to `harassment_reports`
- [ ] Report generation skipped for NR-1-only companies
- [ ] Report generation still works for Insights-enabled companies
- [ ] `report_type` constraint updated to include `'nr1'`
- [ ] Error in side-effect writes does not fail the submission

**Next:** `PHASE_4_brightmonitor_nr1_realign_dashboard.md` — Dashboard data adaptation
