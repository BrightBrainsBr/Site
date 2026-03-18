# Bright Precision B2B Company Dashboard — Phase 2: Auth Integration

**Cursor Agent:** /backend-engineer
**Wave:** 1
**Objective:** Adapt Supabase Auth for B2B — rewrite callback/confirm to use company_users, create useB2BCompanyUser hook, add empresa layout and login/dashboard pages.
**Depends on:** Phase 0 (company_users table must exist)

**Files owned by this phase:**
- `frontend/auth/callback/route.ts` (modify)
- `frontend/auth/confirm/route.ts` (modify)
- `frontend/auth/auth.interface.ts` (modify)
- `frontend/auth/services_and_hooks/useB2BCompanyUser.ts` (create)
- `frontend/auth/services_and_hooks/authService.ts` (modify)
- `frontend/auth/signin/page.tsx` (modify)
- `frontend/auth/signup/page.tsx` (modify)
- `frontend/auth/signout/page.tsx` (modify)
- `frontend/auth/update-password/page.tsx` (modify)
- `frontend/auth/services_and_hooks/useUserRoles.ts` (delete)
- `frontend/app/api/b2b/me/route.ts` (create)
- `frontend/app/[locale]/empresa/layout.tsx` (create)
- `frontend/app/[locale]/empresa/page.tsx` (create)
- `frontend/app/[locale]/empresa/login/page.tsx` (create)
- `frontend/app/[locale]/empresa/dashboard/page.tsx` (create)
- `frontend/features/b2b-dashboard/components/B2BLoginComponent.tsx` (create)

---

## 1. Files to Create

```
frontend/
├── auth/
│   ├── callback/route.ts           # MODIFY
│   ├── confirm/route.ts            # MODIFY
│   ├── auth.interface.ts          # MODIFY
│   ├── signin/page.tsx             # MODIFY
│   ├── signup/page.tsx             # MODIFY
│   ├── signout/page.tsx            # MODIFY
│   ├── update-password/page.tsx    # MODIFY
│   └── services_and_hooks/
│       ├── useB2BCompanyUser.ts    # CREATE
│       ├── authService.ts          # MODIFY
│       └── useUserRoles.ts         # DELETE
├── app/
│   ├── api/b2b/me/route.ts         # CREATE
│   └── [locale]/empresa/
│       ├── layout.tsx              # CREATE
│       ├── page.tsx                # CREATE
│       ├── login/page.tsx          # CREATE
│       └── dashboard/page.tsx      # CREATE
└── features/b2b-dashboard/
    └── components/
        └── B2BLoginComponent.tsx   # CREATE
```

---

## 2. What to Build

### 2.1 `frontend/auth/callback/route.ts`

**Purpose:** Handle OAuth/code callback. Redirect B2B users to empresa dashboard.

**Changes:**
- Remove lookups for `admins`, `university_users`, `learners`.
- After `exchangeCodeForSession`, get user. Query `company_users` WHERE `user_id = user.id`.
- If found → redirect to `/[locale]/empresa/dashboard` (use default locale `pt-BR` or from URL).
- If not found → redirect to `/[locale]/empresa/login?error=unauthorized`.
- Keep password recovery flow (`type=recovery`) unchanged → redirect to `/auth/update-password`.
- Update all `/login` redirects to `/[locale]/empresa/login`.

### 2.2 `frontend/auth/confirm/route.ts`

**Purpose:** Handle invite confirmation (magic link). Same logic as callback for company_users.

**Changes:**
- Remove Mindless Academy table checks.
- Exchange code → get user → lookup `company_users` by `user_id`.
- If found → redirect `/[locale]/empresa/dashboard`.
- If not found → redirect `/[locale]/empresa/login?error=unauthorized`.

### 2.3 `frontend/auth/auth.interface.ts`

**Changes:**
- `UserType`: add `'company_hr'`; remove or keep `'admin'`, `'university_user'`, `'learner'` as needed for type union.
- Remove `Organization`, `EnrichedOrganization`, `SubscriptionStatus` if unused, or keep for compatibility.
- Simplify to what B2B needs.

### 2.4 `frontend/auth/services_and_hooks/useB2BCompanyUser.ts`

**Purpose:** TanStack Query hook that fetches `GET /api/b2b/me`.

**Signature:**
```ts
export function useB2BCompanyUser(): {
  data: { company_id: string; company_name: string; current_cycle: object; cycles: object[] } | null;
  isLoading: boolean;
  error: Error | null;
  isCompanyUser: boolean;
  refetch: () => void;
}
```

- Only runs when user is authenticated (check `useAuthHook().isAuthenticated` or session).
- Returns `isCompanyUser: !!data` when data is loaded.
- Used by empresa layout for session guard.

### 2.5 `frontend/auth/services_and_hooks/authService.ts`

**Changes:**
- Update hardcoded redirect paths: `/onboarding/basic-info` → `/[locale]/empresa/dashboard`, `/login?logout=success` → `/[locale]/empresa/login?logout=success`.
- Search for any `/login` or `/academy` paths and update to empresa equivalents.

### 2.6 `frontend/auth/signin/page.tsx`, `signout/page.tsx`, `update-password/page.tsx`

**Changes:**
- Redirect targets: `/login` → `/[locale]/empresa/login` (or `/pt-BR/empresa/login` as default).

### 2.7 `frontend/auth/signup/page.tsx`

**Changes:**
- Disable self-signup for B2B. Show message: "Acesso via convite — verifique seu e-mail." with a link to login.
- No form submission for new signups.

### 2.8 `frontend/auth/services_and_hooks/useUserRoles.ts`

**Action:** Delete. Replaced by `useB2BCompanyUser`.

### 2.9 `frontend/app/api/b2b/me/route.ts`

**Purpose:** Resolve company for authenticated user.

**Logic:**
1. Get session via `createClient()` (or server Supabase with cookies) → `getUser()`.
2. If no user → 401.
3. Query `company_users` JOIN `companies` WHERE `user_id = user.id`. Select `company_id`, `companies.name`, `role`.
4. Query `assessment_cycles` WHERE `company_id` ORDER BY `is_current DESC`, `starts_at DESC`. Get `cycles[]` and `current_cycle` (where `is_current = true`).
5. Return `{ company_id, company_name, role, cycles, current_cycle }`.
6. If not in company_users → 401.

### 2.10 `frontend/app/[locale]/empresa/layout.tsx`

**Purpose:** Session guard for all `/empresa/*` routes.

**Logic:**
- Use `useAuthHook()` for `isAuthenticated`, `isLoading`.
- Use `useB2BCompanyUser()` for `isCompanyUser`, `isLoading`.
- If not authenticated → redirect to `/[locale]/empresa/login`.
- If authenticated but not `isCompanyUser` (and not loading) → redirect to `/[locale]/empresa/login?error=unauthorized`.
- Render `children` with dark layout (match avaliacao/portal style).
- Wrap with `ConditionalAuthProvider` or ensure auth context is available.

### 2.11 `frontend/app/[locale]/empresa/page.tsx`

**Purpose:** Root redirect.

**Logic:**
- If session + company user → redirect to `/[locale]/empresa/dashboard`.
- Else → redirect to `/[locale]/empresa/login`.

### 2.12 `frontend/app/[locale]/empresa/login/page.tsx`

**Purpose:** HR login page.

**Logic:**
- Render `B2BLoginComponent` with `view='sign_in'`, `hideProviders=true`.
- If already authenticated + company user → redirect to dashboard.
- Use same dark layout as empresa (or inherit from layout).

### 2.13 `frontend/app/[locale]/empresa/dashboard/page.tsx`

**Purpose:** Protected dashboard shell.

**Logic:**
- Render placeholder or `B2BDashboardComponent` (from Phase 4). For this phase, a simple "Dashboard" heading is enough — Phase 4 will add the full UI.
- Ensure layout guard allows access (user is company user).

### 2.14 `frontend/features/b2b-dashboard/components/B2BLoginComponent.tsx`

**Purpose:** Email + password login form for B2B.

**Logic:**
- Use `AuthForm` from auth (if exists) with `view='sign_in'`, `hideProviders=true`.
- Or build minimal form: email, password, submit. Call `authService.signIn()`.
- On success → redirect to `/[locale]/empresa/dashboard`.
- Match dark theme of empresa/portal.

---

## 3. Database Migration

None. Uses `company_users`, `companies`, `assessment_cycles` from Phase 0.

---

## 4. Integration Points

| File | Change |
|------|--------|
| `frontend/auth/components/ConditionalAuthProvider.tsx` | Ensure empresa routes are wrapped with auth provider. Check if layout or root layout already provides it. |
| `frontend/app/[locale]/layout.tsx` | Empresa is under [locale], so it inherits. No change unless auth provider is route-specific. |

**Supabase setup checklist (document in phase or PRD):**
- Enable email provider in Supabase Auth
- Set site URL
- Add `/auth/callback` and `/auth/confirm` to redirect allow-list
- Configure invite email template

---

## 5. Phase Completion Checklist

- [ ] Callback redirects company_users to `/empresa/dashboard`
- [ ] Confirm redirects company_users to `/empresa/dashboard`
- [ ] useB2BCompanyUser hook created, calls GET /api/b2b/me
- [ ] GET /api/b2b/me returns company data for company_users
- [ ] authService redirect paths updated
- [ ] signin, signout, update-password redirect to empresa/login
- [ ] signup shows invite-only message
- [ ] useUserRoles.ts deleted
- [ ] empresa layout, page, login, dashboard pages created
- [ ] B2BLoginComponent created
- [ ] Manual test: invite user → confirm → land on dashboard

**Next:** `PHASE_3_b2b_dashboard_aggregation_apis.md` — Overview, departments, domains, compliance, alerts APIs
