'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { B2BDashboardComponent } from '~/features/b2b-dashboard/components/B2BDashboardComponent'
import { apiGet } from '~/shared/utils/api-helpers'

import { PortalAdminTab } from './PortalAdminTab'
import { PortalCodeGateComponent } from './PortalCodeGateComponent'
import { PortalTopNav } from './PortalTopNav'

interface CompanyDetail {
  id: string
  name: string
  cnpj: string | null
  contact_email: string | null
  active: boolean
  gro_issued_at: string | null
  gro_valid_until: string | null
  allowed_domains: string[] | null
  created_at: string
}

type ActiveView = 'dashboard' | 'admin'

export function PortalEmpresaDetailPageComponent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const urlParams = useParams()
  const locale = (urlParams?.locale as string) ?? 'pt-BR'
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')

  const resolveParams = useCallback(async () => {
    const p = await params
    setCompanyId(p.id)
  }, [params])

  useEffect(() => {
    void resolveParams()
  }, [resolveParams])

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

  useEffect(() => {
    if (!isAuthenticated || !companyId) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/portal/companies/${companyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCompany(data)
      })
      .catch(() => {
        if (!cancelled) setCompany(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, companyId])

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#00c9b1]" />
      </div>
    )
  }

  if (!company) {
    return (
      <>
        <PortalTopNav />
        <div className="p-4 md:p-8">
          <p className="text-red-400">Empresa não encontrada.</p>
          <Link
            href={`/${locale}/portal/empresas`}
            className="mt-4 inline-block text-[#00c9b1] hover:underline"
          >
            Voltar
          </Link>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#07111F]">
      <PortalTopNav companyName={company.name} />
      <div className="flex items-center gap-1 border-b border-[rgba(255,255,255,0.08)] bg-[#0a1628] px-4 py-1.5 md:px-8">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
            activeView === 'dashboard'
              ? 'bg-[#0E1E33] text-[#cce6f7]'
              : 'text-[#5a7fa0] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#cce6f7]'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveView('admin')}
          className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
            activeView === 'admin'
              ? 'bg-[#0E1E33] text-[#cce6f7]'
              : 'text-[#5a7fa0] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#cce6f7]'
          }`}
        >
          Configurações
        </button>
      </div>

      {activeView === 'dashboard' && (
        <B2BDashboardComponent
          companyId={company.id}
          companyName={company.name}
          isPortalMode
        />
      )}

      {activeView === 'admin' && (
        <PortalAdminTab
          company={company}
          onCompanyUpdate={(updated) =>
            setCompany((prev) => (prev ? { ...prev, ...updated } : prev))
          }
        />
      )}
    </div>
  )
}
