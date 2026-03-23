# Bright Precision B2B Company Dashboard — Phase 5b: Admin Company Management Frontend

**Cursor Agent:** /frontend-engineer
**Wave:** 3
**Objective:** Build the portal admin UI for company management — list, create, detail, invite HR, generate codes, manage cycles.
**Depends on:** Phase 5a (portal companies API routes)

**Files owned by this phase:**
- `frontend/app/[locale]/portal/empresas/page.tsx` (create)
- `frontend/app/[locale]/portal/empresas/[id]/page.tsx` (create)
- `frontend/features/portal/components/CompanyManagerComponent.tsx` (create)
- `frontend/features/portal/components/CompanyCodeGeneratorComponent.tsx` (create)
- `frontend/features/portal/components/PortalHeaderComponent.tsx` (modify)

---

## 1. Files to Create

```
frontend/
├── app/[locale]/portal/
│   └── empresas/
│       ├── page.tsx                    # CREATE — company list
│       └── [id]/
│           └── page.tsx                # CREATE — company detail
└── features/portal/
    └── components/
        ├── PortalHeaderComponent.tsx   # MODIFY — add Empresas nav link
        ├── CompanyManagerComponent.tsx # CREATE
        └── CompanyCodeGeneratorComponent.tsx # CREATE
```

---

## 2. What to Build

### 2.1 `frontend/features/portal/components/PortalHeaderComponent.tsx`

**Modify:** Add "Empresas" navigation link.
- Add a link or button that navigates to `/[locale]/portal/empresas`
- Place next to existing nav items (e.g. "Pacientes" or similar)
- Match existing header styling

### 2.2 `frontend/app/[locale]/portal/empresas/page.tsx`

**Purpose:** Company list page.

**Logic:**
- Fetch GET /api/portal/companies (use TanStack Query or fetch in page/layout)
- Render CompanyManagerComponent with list view
- Show: company name, CNPJ, contact email, evaluation count, last activity (optional)
- "Nova Empresa" button → opens create form or navigates to create flow

### 2.3 `frontend/features/portal/components/CompanyManagerComponent.tsx`

**Purpose:** List + create companies.

**Props:** None (or `companies` from parent).

**Features:**
- Table or card list of companies
- Each row: name, CNPJ, contact_email, stats (evaluations, codes used), link to detail
- "Nova Empresa" button → modal or inline form
- Create form: name (required), cnpj, contact_email. On submit → POST /api/portal/companies. On success → refetch list, close form.

### 2.4 `frontend/app/[locale]/portal/empresas/[id]/page.tsx`

**Purpose:** Company detail page.

**Logic:**
- Fetch GET /api/portal/companies/[id]
- Render: company info (editable), GRO dates, stats
- Sections: Company info (PATCH form), Invite HR (email input + button), Code generator, Cycle management
- Use CompanyCodeGeneratorComponent for codes section

### 2.5 `frontend/features/portal/components/CompanyCodeGeneratorComponent.tsx`

**Purpose:** Generate codes and export CSV.

**Props:** `companyId: string`, `currentCycleId: string`.

**Features:**
- Form: department (text), count (number), optional employee_emails (textarea, one per line)
- "Gerar códigos" button → POST /api/portal/companies/[id]/codes
- On success: show generated codes in a table with columns: code, department, employee_email, shareable_url
- "Exportar CSV" button → GET /api/portal/companies/[id]/codes?format=csv, trigger download
- Display completion stats: started_at, used_at per code (from GET list)

### 2.6 Company Detail Page — Additional Sections

**Invite HR:**
- Input: email. Button: "Convidar RH". POST /api/portal/companies/[id]/invite-hr. Toast on success.

**Cycle Management:**
- List current and past cycles
- "Novo ciclo" form: label, starts_at, ends_at. POST /api/portal/companies/[id]/cycles. On success, new cycle becomes current.

**Company Edit:**
- Form to PATCH: name, cnpj, contact_email, gro_issued_at, gro_valid_until, active

---

## 3. Database Migration

None.

---

## 4. Integration Points

| File | Change |
|------|--------|
| `frontend/features/portal/components/PortalHeaderComponent.tsx` | Add "Empresas" link |
| `frontend/app/[locale]/portal/layout.tsx` | Ensure empresas routes are under portal layout (they are, by path) |

---

## 5. Phase Completion Checklist

- [ ] PortalHeaderComponent has "Empresas" nav link
- [ ] /portal/empresas page shows company list
- [ ] CompanyManagerComponent: list + create form
- [ ] Create company flow works (POST, refetch)
- [ ] /portal/empresas/[id] page shows company detail
- [ ] Company edit form (PATCH) works
- [ ] Invite HR form works
- [ ] CompanyCodeGeneratorComponent: generate codes, display with shareable_url
- [ ] CSV export downloads correctly
- [ ] Cycle creation form works
- [ ] Dark theme consistent with portal

**Next:** All phases complete. Feature ready for QA and deployment.
