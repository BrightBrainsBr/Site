// frontend/features/portal/components/PortalPageComponent.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'

import { apiGet } from '~/shared/utils/api-helpers'

import { EvaluationListViewComponent } from './EvaluationListViewComponent'
import { PortalCodeGateComponent } from './PortalCodeGateComponent'
import { PortalTopNav } from './PortalTopNav'

export function PortalPageComponent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const result = await apiGet('/api/portal/evaluations')
      setIsAuthenticated(result.success)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setIsCheckingAuth(false)
    }
  }, [])

  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

  const handleCodeSuccess = useCallback(() => {
    setIsAuthenticated(true)
  }, [])

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#00c9b1]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PortalCodeGateComponent onSuccess={handleCodeSuccess} />
  }

  return (
    <>
      <PortalTopNav />
      <EvaluationListViewComponent />
    </>
  )
}
