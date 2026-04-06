// frontend/features/b2b-dashboard/components/B2BDashboardComponent.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronDown, LogOut, Menu, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'

import { useB2BCompliance } from '../hooks/useB2BCompliance'
import { useB2BEmployeeTrackingQueryHook } from '../hooks/useB2BEmployeeTrackingQueryHook'
import { useB2BLocaleHook } from '../hooks/useB2BLocaleHook'
import { useB2BOverview } from '../hooks/useB2BOverview'
import { useB2BSession } from '../hooks/useB2BSession'
import { B2BEmployeeTrackingComponent } from './shared/B2BEmployeeTrackingComponent'
import { B2BActionPlanTab } from './tabs/B2BActionPlanTab'
import { B2BComplianceTab } from './tabs/B2BComplianceTab'
import { B2BEventsTab } from './tabs/B2BEventsTab'
import { B2BGROTab } from './tabs/B2BGROTab'
import { B2BOverviewTab } from './tabs/B2BOverviewTab'
import { B2BPercepcaoTab } from './tabs/B2BPercepcaoTab'
import { B2BReportsTab } from './tabs/B2BReportsTab'
import { B2BSetoresTab } from './tabs/B2BSetoresTab'
import { B2BSettingsTab } from './tabs/B2BSettingsTab'

type TabId =
  | 'visao-geral'
  | 'setores'
  | 'gro'
  | 'plano-acao'
  | 'eventos'
  | 'percepcao'
  | 'compliance'
  | 'relatorios'
  | 'settings'

interface TabDef {
  id: TabId
  label: string
  icon: string
}

const DASHBOARD_TABS: TabDef[] = [
  { id: 'visao-geral', label: 'Visão Geral', icon: '📊' },
  { id: 'setores', label: 'Setores', icon: '🏢' },
  { id: 'gro', label: 'GRO Psicossocial', icon: '⚖️' },
  { id: 'plano-acao', label: 'Plano de Ação', icon: '🔄' },
  { id: 'eventos', label: 'Eventos & Nexo', icon: '🚨' },
  { id: 'percepcao', label: 'Percepção Organizacional', icon: '💬' },
  { id: 'compliance', label: 'Compliance', icon: '✅' },
  { id: 'relatorios', label: 'Relatórios', icon: '📄' },
]

const PORTAL_EXTRA_TABS: TabDef[] = [
  { id: 'settings', label: 'Configurações', icon: '⚙️' },
]

interface CycleShape {
  id: string
  label: string
  starts_at: string
  ends_at: string
  is_current?: boolean
}

interface B2BDashboardProps {
  companyId?: string | null
  companyName?: string | null
  isPortalMode?: boolean
  extraTabs?: React.ReactNode
}

export function B2BDashboardComponent({
  companyId: companyIdProp,
  companyName: companyNameProp,
  isPortalMode = false,
}: B2BDashboardProps = {}) {
  const router = useRouter()
  const session = useB2BSession()
  const { localePath } = useB2BLocaleHook()

  const companyId = companyIdProp ?? session.companyId
  const companyName = companyNameProp ?? session.companyName
  const userEmail = session.userEmail

  const { data: portalCycles } = useQuery<CycleShape[]>({
    queryKey: ['portal', 'cycles', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/portal/companies/${companyId}/cycles`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: isPortalMode && !!companyId,
    staleTime: 60_000,
  })

  const currentCycle = isPortalMode
    ? (portalCycles?.find((c) => c.is_current) ?? portalCycles?.[0] ?? null)
    : session.currentCycle
  const cycles = isPortalMode ? (portalCycles ?? []) : session.cycles

  const [cycleId, setCycleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsString.withDefault('visao-geral')
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentCycle?.id && !cycleId) {
      setCycleId(currentCycle.id)
    }
  }, [currentCycle?.id, cycleId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data: overview } = useB2BOverview(companyId, cycleId)
  const { data: compliance } = useB2BCompliance(companyId, cycleId)
  const { data: tracking, isLoading: trackingLoading } =
    useB2BEmployeeTrackingQueryHook(companyId)

  const hasValidGro =
    !!compliance?.groValidUntil &&
    new Date(compliance.groValidUntil) > new Date()

  const visibleTabs = isPortalMode
    ? [...DASHBOARD_TABS, ...PORTAL_EXTRA_TABS]
    : DASHBOARD_TABS

  const showOnboarding =
    !isPortalMode &&
    !trackingLoading &&
    tracking != null &&
    tracking.completionPct < 30

  const noInvites =
    !trackingLoading && tracking != null && tracking.total === 0

  useEffect(() => {
    if (!isPortalMode && noInvites) {
      void setActiveTab('settings')
    }
  }, [noInvites, isPortalMode, setActiveTab])

  const activeCycleId = cycleId ?? currentCycle?.id
  const updatedDate = compliance?.cycle?.ends_at
    ? new Date(compliance.cycle.ends_at).toLocaleDateString('pt-BR')
    : '–'

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push(localePath('/login'))
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-[#060d1a]">
      {/* Sidebar — desktop fixed, mobile overlay */}
      <aside
        className={`fixed ${isPortalMode ? 'top-[57px]' : 'top-0'} bottom-0 left-0 z-30 flex w-[220px] flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0c1425] transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo — hidden in portal mode since PortalTopNav provides branding */}
        {!isPortalMode && (
          <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(197,225,85,0.15)]">
                <span className="text-[16px]">🧠</span>
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#c5e155]">
                  BrightMonitor
                </div>
                <div className="text-[10px] text-[#64748b]">Saúde Mental Corporativa</div>
              </div>
            </div>
          </div>
        )}

        {/* Cycle selector */}
        {cycles.length > 0 && (
          <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Ciclo
            </label>
            <select
              value={activeCycleId ?? ''}
              onChange={(e) => setCycleId(e.target.value)}
              className="w-full rounded-md border border-[rgba(255,255,255,0.06)] bg-[#111b2e] px-2 py-1.5 text-[13px] text-[#e2e8f0] focus:border-[rgba(197,225,85,0.3)] focus:outline-none"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav tabs */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
            Módulos
          </div>
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                void setActiveTab(t.id)
                setSidebarOpen(false)
              }}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-all ${
                activeTab === t.id
                  ? 'bg-[rgba(197,225,85,0.15)] font-semibold text-[#c5e155]'
                  : 'font-normal text-[#94a3b8] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e2e8f0]'
              }`}
            >
              <span className="text-[15px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-3">
          <div className="truncate text-[11px] text-[#64748b]">
            {companyName ?? 'Empresa'}
          </div>
          <div className="mt-0.5 text-[10px] text-[#64748b]">
            Atualizado: {updatedDate}
          </div>
          {hasValidGro && (
            <span className="mt-1.5 inline-block rounded-full bg-[rgba(34,197,94,0.15)] px-2 py-0.5 text-[10px] font-semibold text-[#22c55e]">
              ✓ GRO Emitido
            </span>
          )}
          {!hasValidGro && compliance && (
            <span className="mt-1.5 inline-block rounded-full bg-[rgba(234,179,8,0.15)] px-2 py-0.5 text-[10px] font-semibold text-[#eab308]">
              ⚠ GRO Pendente
            </span>
          )}
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-[220px]">
        {/* Top bar — in portal mode only show mobile hamburger (PortalTopNav handles branding) */}
        {isPortalMode ? (
          <div className="flex items-center border-b border-[rgba(255,255,255,0.06)] bg-[#060d1a] px-4 py-2.5 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[rgba(255,255,255,0.04)]"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <header className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#0c1425] px-4 py-2.5 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[rgba(255,255,255,0.04)] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-1.5 lg:flex">
              <span className="text-[12px] text-[#64748b]">Empresa:</span>
              <span className="text-[14px] font-semibold text-[#c5e155]">
                {companyName ?? 'Empresa'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(197,225,85,0.15)]">
                    <User className="h-3.5 w-3.5 text-[#c5e155]" />
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-[#94a3b8] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111b2e] py-2 shadow-xl">
                    {userEmail && (
                      <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#64748b]">
                          Conectado como
                        </p>
                        <p className="mt-0.5 truncate text-[13px] font-medium text-[#e2e8f0]">
                          {userEmail}
                        </p>
                      </div>
                    )}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          router.push(localePath('/empresa/perfil'))
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[#94a3b8] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e2e8f0]"
                      >
                        <User className="h-4 w-4" />
                        Meu Perfil
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          void setActiveTab('settings')
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[#94a3b8] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e2e8f0]"
                      >
                        <Settings className="h-4 w-4" />
                        Configurações
                      </button>
                    </div>
                    <div className="border-t border-[rgba(255,255,255,0.06)] pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[#F87171] transition-colors hover:bg-[rgba(239,68,68,0.06)]"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Tab content */}
        <main className="flex-1 overflow-auto px-4 py-5 lg:px-7">
          {showOnboarding ? (
            <B2BEmployeeTrackingComponent data={tracking} />
          ) : (
            <>
              {activeTab === 'visao-geral' && (
                <B2BOverviewTab
                  companyId={companyId}
                  cycleId={cycleId}
                  overview={overview}
                  isPortalMode={isPortalMode}
                  onNavigateToSettings={() => void setActiveTab('settings')}
                />
              )}
              {activeTab === 'setores' && (
                <B2BSetoresTab companyId={companyId} cycleId={cycleId} />
              )}
              {activeTab === 'gro' && (
                <B2BGROTab companyId={companyId} cycleId={cycleId} />
              )}
              {activeTab === 'plano-acao' && (
                <B2BActionPlanTab companyId={companyId} cycleId={cycleId} />
              )}
              {activeTab === 'eventos' && (
                <B2BEventsTab companyId={companyId} cycleId={cycleId} />
              )}
              {activeTab === 'percepcao' && (
                <B2BPercepcaoTab companyId={companyId} cycleId={cycleId} />
              )}
              {activeTab === 'compliance' && (
                <B2BComplianceTab companyId={companyId} cycleId={cycleId} />
              )}
              {activeTab === 'relatorios' && (
                <B2BReportsTab companyId={companyId} cycleId={cycleId} />
              )}
              {activeTab === 'settings' && (
                <B2BSettingsTab companyId={companyId} isPortalMode={isPortalMode} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
