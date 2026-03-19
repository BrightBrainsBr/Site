// frontend/features/b2b-dashboard/hooks/useB2BSession.ts

'use client'

import { useB2BCompanyUser } from '@/auth/services_and_hooks/useB2BCompanyUser'

export function useB2BSession() {
  const {
    data,
    isLoading,
    isCompanyUser,
    companyId,
    companyName,
    currentCycle,
    cycles,
    refetch,
  } = useB2BCompanyUser()

  return {
    session: data,
    isLoading,
    isCompanyUser,
    companyId: companyId ?? null,
    companyName: companyName ?? null,
    currentCycle: currentCycle ?? null,
    cycles: cycles ?? [],
    refetch,
  }
}
