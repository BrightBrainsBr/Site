# Portal Comitê Médico — Phase 2: Pages, Code Gate & List View

**Cursor Agent:** /frontend-engineer
**Wave:** 1
**Objective:** Build the portal pages, code gate authentication screen, header, and evaluation list view with filters/search/sort.
**Depends on:** Phase 1 (API routes must exist)

**Files owned by this phase:**
- `frontend/app/[locale]/portal/layout.tsx`
- `frontend/app/[locale]/portal/page.tsx`
- `frontend/features/portal/components/PortalPageComponent.tsx`
- `frontend/features/portal/components/PortalCodeGateComponent.tsx`
- `frontend/features/portal/components/PortalHeaderComponent.tsx`
- `frontend/features/portal/components/EvaluationListViewComponent.tsx`
- `frontend/features/portal/components/StatusBadgeComponent.tsx`
- `frontend/features/portal/components/ProfileBadgeComponent.tsx`
- `frontend/features/portal/hooks/useEvaluationsQueryHook.ts`

---

## 1. Files to Create

```
frontend/
├── app/[locale]/portal/
│   ├── layout.tsx
│   └── page.tsx
│
├── features/portal/
│   ├── components/
│   │   ├── PortalPageComponent.tsx
│   │   ├── PortalCodeGateComponent.tsx
│   │   ├── PortalHeaderComponent.tsx
│   │   ├── EvaluationListViewComponent.tsx
│   │   ├── StatusBadgeComponent.tsx
│   │   └── ProfileBadgeComponent.tsx
│   └── hooks/
│       └── useEvaluationsQueryHook.ts
```

---

## 2. What to Build

### layout.tsx

- Metadata: `title: 'Portal Clínico | Bright Brains'`, `robots: 'noindex, nofollow'`
- Dark theme wrapper: `min-h-screen` with `bg-[#060e1a]` and `text-[#cce6f7]`
- Import Google Fonts for portal: Syne, DM Sans, JetBrains Mono (via `next/font/google` or via the existing font setup)
- Children rendered inside `<main>`

### page.tsx

Thin wrapper that renders `PortalPageComponent`.

### PortalPageComponent

- Checks for `portal_session` cookie on mount (read via `document.cookie`)
- State: `isAuthenticated: boolean`
- If not authenticated: render `PortalCodeGateComponent` with `onSuccess` callback that sets `isAuthenticated = true`
- If authenticated: render `PortalHeaderComponent` + `EvaluationListViewComponent`

### PortalCodeGateComponent

- **Visual:** Full-screen centered card matching the avaliacao code entry aesthetic:
  - Dark background (`#060e1a`)
  - Card with `surface` bg (`#0c1a2e`), `border` (`#1a3a5c`), rounded-xl
  - Logo icon (brain gradient icon, Syne "Bright Brains" + subtitle "Portal Clínico")
  - Single text input for access code, `accent` focus border
  - Submit button with `accent` bg (`#00c9b1`), black text, bold
  - Error state: red text below input
- **Behavior:**
  - On submit, POST to `/api/portal/validate-code` with `{ code }`
  - If `valid: true`, calls `onSuccess()`
  - If invalid, shows "Código inválido" error

### PortalHeaderComponent

- **Visual:** Sticky top header matching HTML sketch `<header>`:
  - `surface` background, `border` bottom
  - Left: Logo icon (gradient square) + "Bright Brains" (Syne 700) + "Portal Clínico" subtitle (uppercase, text-dim, letter-spacing)
  - Right: Stats text ("Pendentes: N · Aprovados: N") + badge count ("N pacientes" in accent pill)
- **Props:** `totalCount: number`, `pendingCount: number`, `approvedCount: number`

### EvaluationListViewComponent

This is the main component. Layout: sidebar + content area.

- **Data:** `useEvaluationsQueryHook()` with URL state params
- **URL State (nuqs):** `status`, `profile`, `search`, `sort` — all optional string params

**Sidebar (left, 260px, sticky):**
- Section: "Perfil Clínico" — filter buttons for each profile (Todos, Adulto, Infantil, Neuro, Executivo, Longevidade). Each with colored dot (from `profile-options.ts`), count badge. Active state = teal tint background.
- Section: "Status" — filter buttons: Todos, Pendente, Aprovado, Rejeitado. Active = teal tint.
- Match HTML sketch sidebar filter buttons: `.filter-btn` style — transparent bg, `text-dim`, hover `surface2` bg, active teal tint + teal text

**Content area (right, flex-1):**
- **Toolbar (top):** Search input (left, flex-1, icon + input, border focus = accent) + Sort buttons (right): "Data" and "Nome" with active state
- **Table:** Full-width, `border` border, rounded corners
  - **Header row:** `surface2` bg, uppercase labels (11px, letter-spacing), muted color
  - **Columns:** Paciente (name, bold white), Perfil (ProfileBadge), Data de Entrada (mono, dim + "Xd atrás"), Status (StatusBadge), PDF (link icon if available), Ação ("Ver" button)
  - **Row behavior:** Click row → `router.push(/portal/${id})`
  - **Row hover:** `rgba(0,201,177,0.05)` background
  - **Empty state:** Centered icon + "Nenhuma avaliação encontrada" text

### StatusBadgeComponent

- **Props:** `status: ReviewerStatus`
- **Visual:** Inline pill badge with status-specific colors from PRD section 9 status badge colors
- Renders status label: "Pendente" / "Aprovado" / "Rejeitado"

### ProfileBadgeComponent

- **Props:** `profile: string`
- **Visual:** Inline pill badge with profile-specific colors from `profile-options.ts`
- Renders profile label with small colored dot

### useEvaluationsQueryHook

```typescript
import { useQuery } from '@tanstack/react-query'
import type { EvaluationListItem } from '../portal.interface'

interface UseEvaluationsParams {
  status?: string
  profile?: string
  search?: string
  sort?: string
}

export function useEvaluationsQueryHook(params: UseEvaluationsParams) {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.set('status', params.status)
  if (params.profile) searchParams.set('profile', params.profile)
  if (params.search) searchParams.set('search', params.search)
  if (params.sort) searchParams.set('sort', params.sort)

  return useQuery<EvaluationListItem[], Error>({
    queryKey: ['portal', 'evaluations', params],
    queryFn: async () => {
      const res = await fetch(`/api/portal/evaluations?${searchParams}`)
      if (!res.ok) throw new Error('Failed to fetch evaluations')
      return res.json()
    },
  })
}
```

---

## 3. Key Implementation Details

### Tailwind approach

Use inline Tailwind classes with the hex values from the portal theme. Example patterns:

```tsx
// Surface card
<div className="bg-[#0c1a2e] border border-[#1a3a5c] rounded-xl">

// Accent button
<button className="bg-[#00c9b1] text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-[#00e0c4]">

// Table row hover
<tr className="border-b border-[#1a3a5c] cursor-pointer hover:bg-[rgba(0,201,177,0.05)] transition-colors">

// Muted label
<span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#3a5a75]">

// Mono data
<span className="font-mono text-xs text-[#5a7fa0]">
```

### Font imports

If Syne / DM Sans / JetBrains Mono are not already in the global font setup, add them in the portal `layout.tsx` using `next/font/google`:

```typescript
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
```

Apply via CSS variables or className on the layout div.

### nuqs setup for URL state

```typescript
import { useQueryState, parseAsString } from 'nuqs'

const [status, setStatus] = useQueryState('status', parseAsString)
const [profile, setProfile] = useQueryState('profile', parseAsString)
const [search, setSearch] = useQueryState('search', parseAsString)
const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('date_desc'))
```

### Navigation to detail

```typescript
import { useRouter } from 'next/navigation'
const router = useRouter()
// On row click:
router.push(`/portal/${evaluation.id}`)
```

---

## 4. Phase Completion Checklist

- [ ] File created: `app/[locale]/portal/layout.tsx`
- [ ] File created: `app/[locale]/portal/page.tsx`
- [ ] File created: `features/portal/components/PortalPageComponent.tsx`
- [ ] File created: `features/portal/components/PortalCodeGateComponent.tsx`
- [ ] File created: `features/portal/components/PortalHeaderComponent.tsx`
- [ ] File created: `features/portal/components/EvaluationListViewComponent.tsx`
- [ ] File created: `features/portal/components/StatusBadgeComponent.tsx`
- [ ] File created: `features/portal/components/ProfileBadgeComponent.tsx`
- [ ] File created: `features/portal/hooks/useEvaluationsQueryHook.ts`
- [ ] Verified: Code gate blocks access without code
- [ ] Verified: Code gate grants access with correct code
- [ ] Verified: List loads evaluations from DB
- [ ] Verified: Filters work (status, profile)
- [ ] Verified: Search filters by name
- [ ] Verified: Sort toggles work
- [ ] Verified: Row click navigates to `/portal/[id]`

**Next:** `PHASE_3_portal_detail_edit_approve.md` — Detail page, edit form, approval/rejection flow.
