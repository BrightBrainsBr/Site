# BrightMonitor NR-1 — Phase 0: API Namespace Rename

**Cursor Agent:** /frontend-engineer
**Wave:** 0
**Objective:** Rename the API namespace from `b2b` to `brightmonitor`, rename sub-routes (`events` → `incidents`, `nr1-inventory` → `inventory`), and update all ~46 consuming files so the existing dashboard still works against the new routes.
**Depends on:** None

**Files owned by this phase:**

Route directory (moved wholesale):
- `frontend/app/api/b2b/` → `frontend/app/api/brightmonitor/` (entire directory)

Sub-directory renames within `brightmonitor/`:
- `[companyId]/events/` → `[companyId]/incidents/`
- `[companyId]/events/[eventId]/` → `[companyId]/incidents/[eventId]/`
- `[companyId]/nr1-inventory/` → `[companyId]/inventory/`

Consumer files (URL path update):
- `frontend/features/b2b-dashboard/hooks/useB2BOverview.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BAlerts.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BCompliance.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BDepartments.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BDomains.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BGROQueryHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BActionPlansQueryHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BActionPlansMutationHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BEventsQueryHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BEventsMutationHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BPercepcaoQueryHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BEmployeeTrackingQueryHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BNR1InventoryMutationHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BReportsMutationHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BProfileQueryHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BProfileMutationHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BPdfJobsHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BExtractPdfMutationHook.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BSession.ts`
- `frontend/features/b2b-dashboard/hooks/useB2BLocaleHook.ts`
- `frontend/features/b2b-dashboard/components/B2BSignupComponent.tsx`
- `frontend/features/b2b-dashboard/components/B2BLoginComponent.tsx`
- `frontend/features/b2b-dashboard/components/shared/B2BPdfUploadComponent.tsx`
- `frontend/features/b2b-dashboard/components/shared/B2BNR1FieldsComponent.tsx`
- `frontend/app/[locale]/empresa/auth-callback/page.tsx`
- `frontend/auth/services_and_hooks/useB2BCompanyUser.ts`
- `frontend/agents/b2b-laudo/services/b2b-laudo.nodes.ts`

Route files that are ONLY moved (no content modification in this phase — later phases own content changes):
- `brightmonitor/[companyId]/overview/route.ts` → Phase 4
- `brightmonitor/[companyId]/departments/route.ts` → Phase 4
- `brightmonitor/[companyId]/gro/route.ts` → Phase 4
- `brightmonitor/[companyId]/compliance/route.ts` → Phase 4
- `brightmonitor/[companyId]/alerts/route.ts` → Phase 4
- `brightmonitor/[companyId]/domains/route.ts` → Phase 4
- `brightmonitor/lib/riskUtils.ts` → Phase 4
- `brightmonitor/[companyId]/reports/route.ts` → Phase 5
- `brightmonitor/[companyId]/settings/route.ts` → Phase 6
- `brightmonitor/[companyId]/percepcao/route.ts` → Phase 6

---

## 1. Files to Create

No new files. This phase moves and modifies existing files.

## 2. What to Build

### 2a. Directory Move

Single shell command:

```bash
mv frontend/app/api/b2b frontend/app/api/brightmonitor
```

Then rename sub-directories:

```bash
mv frontend/app/api/brightmonitor/[companyId]/events frontend/app/api/brightmonitor/[companyId]/incidents
mv frontend/app/api/brightmonitor/[companyId]/nr1-inventory frontend/app/api/brightmonitor/[companyId]/inventory
```

### 2b. Update File Path Comments

Every moved route file starts with a `// frontend/app/api/b2b/...` comment. Update all of them to `// frontend/app/api/brightmonitor/...`.

### 2c. Update Relative Imports Inside Route Files

Route files import from `../../lib/getB2BUser` and `../../lib/riskUtils`. After the directory move, these relative imports still resolve correctly (the `lib/` directory moves with the parent). **No import changes needed in route files.**

However, the renamed sub-directories (`incidents/`, `inventory/`) may have internal references to their own path in comments or error messages. Update those.

### 2d. Update All Consumer Files

In every hook, component, auth file, and agent file listed above, perform a mechanical find-and-replace:

1. `/api/b2b/` → `/api/brightmonitor/`
2. In hooks that reference `events`: also update URL path segments from `/events` to `/incidents` and from `/nr1-inventory` to `/inventory`
3. In hooks that have `[eventId]` in their URL construction, update to match the new `incidents/[eventId]` path

The replacement is purely in string literals (fetch URLs). No logic changes.

### 2e. Add TODO Markers

Add a comment at the top of `B2BDashboardComponent.tsx`:
```typescript
// TODO: rename feature folder from b2b-dashboard to brightmonitor-dashboard
```

### 2f. Smoke Test

After all renames, the existing dashboard must still load and display data against the renamed routes. Verify:
- `/empresa/dashboard` loads
- Overview tab renders KPIs
- Setores tab renders department table
- Action Plans tab renders CRUD
- Settings tab renders

---

## 4. Integration Points

None beyond the file modifications listed above. This phase is entirely mechanical.

## 5. Phase Completion Checklist

- [ ] Directory moved: `frontend/app/api/b2b/` → `frontend/app/api/brightmonitor/`
- [ ] Sub-rename: `events/` → `incidents/`
- [ ] Sub-rename: `nr1-inventory/` → `inventory/`
- [ ] All 20 hook files updated with new URL paths
- [ ] All 5 component/page files updated with new URL paths
- [ ] `useB2BCompanyUser.ts` updated
- [ ] `b2b-laudo.nodes.ts` updated
- [ ] All file path comments updated in moved route files
- [ ] `npm run build` passes (no broken imports)
- [ ] Dashboard loads successfully against renamed routes

**Next:** `PHASE_1_brightmonitor_nr1_realign_db.md` — Database migrations for NR-1 columns and new tables
