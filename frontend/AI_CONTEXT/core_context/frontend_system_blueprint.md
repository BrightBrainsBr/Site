
# Bright Brains — Frontend Architecture & Conventions

This document outlines the architecture, conventions, and best practices for developing the Bright Brains frontend. Its purpose is to ensure consistency, maintainability, and a high-quality development experience.

## 1. Project Overview

The Bright Brains website is a **Next.js 15** application with two distinct layers:

- **Legacy CMS Layer** — Strapi-driven pages and layouts via `@futurebrand/helpers-nextjs`. Located in root-level directories (`components/`, `layouts/`, `services/`). Do not modify unless explicitly asked.
- **New Feature Layer** — Feature-based modules built with Next.js API routes + Supabase. Located in `features/` and `shared/`. All new work goes here.

**Tech Stack:**
- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4, tailwind-variants, tailwind-merge
- TanStack Query, Zustand, nuqs (new features)
- React Hook Form (forms)
- Supabase (database, via API routes)
- next-intl (i18n with `[locale]` routing)
- Anthropic Claude (AI report generation)
- Deployed on AWS Amplify

## 2. State Management Philosophy

**Choose the right tool for the job to ensure long-term maintainability and prevent common React pitfalls.**

### Guiding Principles (Non-Negotiable)

1. **Always Categorize State First:** Before writing any code, identify the *type* of state you are managing. The categories are:
    - Server State (data from an API)
    - URL State (filters, tabs, search queries)
    - Form State
    - Shared Global UI State (theme, notifications)
    - Complex Local State (mutually exclusive states, state with business rules)
    - Simple, Ephemeral Local UI State

2. **The Principle of Derived State:** **Never** store data in state that can be calculated from other existing state or props during render.
    - **DO:** `const fullName = \`${firstName} ${lastName}\`;`
    - **DON'T:** `const [fullName, setFullName] = useState(''); useEffect(() => { setFullName(...) }, [firstName, lastName]);`

3. **The Synchronization Rule:** The combination of `useState` and `useEffect` to keep two or more states in sync is an anti-pattern. This signals the wrong tool was chosen.

## 3. State Management Toolkit — Decision Hierarchy

Follow this in order. Each tool covers a specific category of state.

### 1. Server State → TanStack Query

- **When:** All state that originates from or is sent to the server (GET, POST, PUT, DELETE).
- **Why:** Replaces the `useState(data)`, `useState(isLoading)`, `useState(error)` anti-pattern. Provides caching, invalidation, re-fetching, and error handling.
- **Rule:** If the data lives in Supabase or any API, it's managed by TanStack Query.

### 2. URL State → `nuqs`

- **When:** UI state that should be reflected in the URL — bookmarkable, shareable, persistent across refreshes.
- **Rule:** If the state controls how a user is viewing data (sort, filter, page, tab), it belongs in the URL.

### 3. Form State → React Hook Form

- **When:** All forms with more than one field or any validation logic.
- **Rule:** All user input forms must use React Hook Form.

### 4. Shared Global UI State → Zustand

- **When:** Client-side UI state shared across multiple non-adjacent components.
- **Rule:** Use for truly global concerns like theme, notification toasts, or global loading indicators. Do **not** store server data here — that's TanStack Query's job.

### 5. Complex Component State → `useReducer`

- **When:** Local state with multiple related values, or when the next state depends on the previous state based on specific actions.
- **Rule:** If you find yourself writing multiple `useState` hooks updated in the same handler, refactor to `useReducer` or a single `useState` with a string enum.

### 6. `useRef` (Non-Rendering State)

- **When:** Values that persist across renders but whose changes must not trigger a re-render.
- **Rule:** Use for timer IDs, DOM refs, analytics counters.

### 7. `useState` (Last Resort)

- **When:** Simple, ephemeral UI state that is completely local to a single component and doesn't fit any category above.
- **Rule:** Before using `useState`, confirm the state is not derived, not from the server, not a form, not part of the URL, not shared globally, and has no complex update logic.

### Legacy Note

The existing assessment feature (`features/assessment/`) uses the simpler pattern of `useState` + `fetch()` for API calls. This is acceptable for that feature. New features must follow the TanStack Query pattern.

## 4. Core Conventions

### File Path Comments

Every file must begin with a comment indicating its full path from the project root:

```typescript
// frontend/features/assessment/components/assessment.interface.ts
```

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase + `Component` suffix | `CreateFormComponent.tsx` |
| Pages | `page.tsx` | `app/[locale]/avaliacao/page.tsx` |
| Services | camelCase + `Service` suffix | `assessmentService.ts` |
| Hooks | camelCase + `Hook` suffix | `useAuthHook.ts` |
| Query Hooks | camelCase + `QueryHook` suffix | `useEvaluationByIdQueryHook.ts` |
| Types | feature + `.interface.ts` | `assessment.interface.ts` |
| API routes | `route.ts` in folder | `app/api/assessment/submit/route.ts` |
| Constants | kebab-case | `scoring-ranges.ts` |
| Stores | camelCase + `Store` suffix | `authStore.ts` |

## 5. Folder Structure

The project uses a dual structure: legacy CMS code at the root level, and new features in a feature-based layout.

```
frontend/
├── app/                              # Routes + API only
│   ├── [locale]/
│   │   ├── layout.tsx                # Root layout (fonts, GTM, ReactQueryProvider)
│   │   ├── (routes)/                 # CMS-driven pages — DO NOT MODIFY
│   │   │   ├── layout.tsx            # Header + Footer + CMS contexts
│   │   │   └── [[...slug]]/page.tsx
│   │   └── avaliacao/                # Assessment (standalone, dark theme)
│   │       ├── layout.tsx
│   │       └── page.tsx
│   └── api/                          # Next.js API routes → Supabase
│       └── assessment/
│           ├── validate-code/route.ts
│           ├── submit/route.ts
│           ├── generate-report/route.ts
│           ├── generate-pdf/route.ts
│           ├── upload/route.ts
│           └── lib/                  # Shared API utilities
│
├── features/                         # Feature modules (new development)
│   └── assessment/
│       ├── components/               # Assessment UI components
│       │   ├── AssessmentPage.tsx     # Main orchestrator
│       │   ├── ProgressBar.tsx
│       │   ├── StepNavigation.tsx
│       │   ├── assessment.interface.ts
│       │   ├── steps/                # Step components
│       │   ├── fields/               # Reusable form fields
│       │   └── constants/            # Scale definitions, options
│       ├── services/                 # localStorage, supabase client
│       └── helpers/                  # Score computation, report data
│
├── shared/                           # Shared code for new features
│   ├── providers/
│   │   └── ReactQueryProvider.tsx
│   ├── hooks/                        # Shared custom hooks
│   └── stores/                       # Zustand stores
│
├── components/                       # Legacy CMS components — DO NOT MODIFY
├── services/                         # Legacy CMS services — DO NOT MODIFY
├── layouts/                          # Legacy CMS layouts — DO NOT MODIFY
├── hooks/                            # Legacy hooks
├── contexts/                         # Legacy state context
├── styles/                           # Tailwind theme and global styles
├── types/                            # Global TypeScript types
├── assets/                           # Icons, fonts
└── configs/                          # CSP, redirects, domains
```

### New Feature Structure Template

```
features/{feature-name}/
├── {feature-name}.interface.ts
├── components/
│   ├── MainComponent.tsx
│   └── SubComponent.tsx
├── services/
│   └── featureApiService.ts
├── hooks/
│   ├── useFeatureQueryHook.ts
│   └── useFeatureMutationHook.ts
├── constants/
│   └── feature-options.ts
└── helpers/
    └── compute-something.ts
```

## 6. API Data Fetching Pattern (New Features)

**RULE: NEVER directly query Supabase from client components.**

### Step 1: Create the API Route

```typescript
// frontend/app/api/my-feature/[id]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from('my_table')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
```

### Step 2: Create the TanStack Query Hook

```typescript
// frontend/features/my-feature/hooks/useMyDataQueryHook.ts
import { useQuery } from '@tanstack/react-query'
import type { MyData } from '../my-feature.interface'

export function useMyDataQueryHook(id: string) {
  return useQuery<MyData, Error>({
    queryKey: ['my-feature', 'detail', id],
    queryFn: async () => {
      const response = await fetch(`/api/my-feature/${id}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch')
      }
      return response.json()
    },
    enabled: !!id,
  })
}
```

### Step 3: Use in Component

```tsx
// frontend/features/my-feature/components/MyDisplayComponent.tsx
'use client'
import { useMyDataQueryHook } from '../hooks/useMyDataQueryHook'

export function MyDisplayComponent({ id }: { id: string }) {
  const { data, isLoading, error } = useMyDataQueryHook(id)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return <div>Not found.</div>

  return <h1>{data.name}</h1>
}
```

## 7. Assessment Feature Reference

The `/avaliacao` assessment is the primary custom feature built on this codebase. It serves as the reference implementation for:

- Multi-step form patterns with `localStorage` persistence
- API route design (validate, submit, generate-report, generate-pdf, upload)
- AI-powered report generation (3-stage Claude pipeline)
- File upload to Supabase storage
- Webhook notifications via n8n

The assessment uses the simpler `useState` + `fetch()` pattern rather than TanStack Query, since it was built before those libraries were adopted. New features should follow the TanStack Query pattern described above.

## 8. Supabase Integration

- **Access:** Server-side only, via Next.js API routes
- **Client:** `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` in API routes
- **Tables used:** `avaliacao_codigo` (access codes), `mental_health_evaluations` (assessment data)
- **Storage:** `assessment-pdfs` bucket for generated PDF reports

## 9. Conclusion

This blueprint establishes a scalable architecture for the Bright Brains frontend. The dual-layer design (legacy CMS + new feature modules) ensures we can build new functionality without disrupting existing pages. By following the prescribed state management hierarchy and feature-based folder structure, we keep the codebase consistent and maintainable as it grows.
