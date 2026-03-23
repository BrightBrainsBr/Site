// frontend/auth/services_and_hooks/useB2BCompanyUser.ts

'use client'

import { useQuery } from '@tanstack/react-query'

export interface B2BCompanyUserData {
  isCompanyUser: boolean
  isCollaborator?: boolean
  user_email?: string | null
  company_id?: string
  company_name?: string | null
  current_cycle?: {
    id: string
    label: string
    starts_at: string
    ends_at: string
  } | null
  cycles?: Array<{
    id: string
    label: string
    starts_at: string
    ends_at: string
  }>
}

async function fetchB2BMe(): Promise<B2BCompanyUserData> {
  const res = await fetch('/api/b2b/me')
  if (res.status === 401) {
    return { isCompanyUser: false }
  }
  const data = await res.json()
  return data as B2BCompanyUserData
}

export function useB2BCompanyUser(enabled = true) {
  const query = useQuery({
    queryKey: ['b2b', 'me'],
    queryFn: fetchB2BMe,
    enabled,
    staleTime: 5 * 60 * 1000,
  })

  return {
    ...query,
    isCompanyUser: query.data?.isCompanyUser ?? false,
    isCollaborator: query.data?.isCollaborator ?? false,
    userEmail: query.data?.user_email ?? null,
    companyId: query.data?.company_id,
    companyName: query.data?.company_name,
    currentCycle: query.data?.current_cycle ?? null,
    cycles: query.data?.cycles ?? [],
  }
}
