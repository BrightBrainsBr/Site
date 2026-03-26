'use client'

import { useCallback, useEffect, useState } from 'react'

import { apiGet } from '~/shared/utils/api-helpers'

import { CompanyManagerComponent } from './CompanyManagerComponent'
import { PortalCodeGateComponent } from './PortalCodeGateComponent'
import { PortalTopNav } from './PortalTopNav'

export function PortalEmpresasPageComponent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

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
      <div className="p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-[#cce6f7] md:text-2xl">Empresas</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-lg bg-[#00c9b1] px-4 py-2 text-sm font-bold text-black hover:opacity-90"
          >
            {showCreate ? 'Cancelar' : 'Nova empresa'}
          </button>
        </div>
        <CompanyManagerComponent
          showCreate={showCreate}
          onCreateDone={() => setShowCreate(false)}
        />
      </div>
    </>
  )
}
