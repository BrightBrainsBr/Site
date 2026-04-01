// frontend/features/b2b-dashboard/components/B2BDashboardComponent.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'

import { useB2BCompliance } from '../hooks/useB2BCompliance'
import { useB2BEmployeeTrackingQueryHook } from '../hooks/useB2BEmployeeTrackingQueryHook'
import { useB2BOverview } from '../hooks/useB2BOverview'
import { useB2BSession } from '../hooks/useB2BSession'
import { B2BHeaderComponent } from './B2BHeaderComponent'
import { B2BEmployeeTrackingComponent } from './shared/B2BEmployeeTrackingComponent'
import { B2BActionPlanTab } from './tabs/B2BActionPlanTab'
import { B2BComplianceTab } from './tabs/B2BComplianceTab'
import { B2BEventsTab } from './tabs/B2BEventsTab'
import { B2BGROTab } from './tabs/B2BGROTab'
import { B2BOverviewTab } from './tabs/B2BOverviewTab'
import { B2BReportsTab } from './tabs/B2BReportsTab'
import { B2BSetoresTab } from './tabs/B2BSetoresTab'
import { B2BSettingsTab } from './tabs/B2BSettingsTab'

type TabId =
  | 'visao-geral'
  | 'setores'
  | 'gro'
  | 'plano-acao'
  | 'eventos'
  | 'compliance'
  | 'relatorios'
  | 'settings'

const COMPANY_TABS: { id: TabId; label: string }[] = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'setores', label: 'Setores' },
  { id: 'gro', label: 'GRO Psicossocial' },
  { id: 'plano-acao', label: 'Plano de Ação' },
  { id: 'eventos', label: 'Eventos & Nexo' },
  { id: 'compliance', label: 'Compliance NR-1' },
  { id: 'relatorios', label: 'Relatórios' },
]

// BB admin portal sees all dashboard tabs + NR-1 settings
const PORTAL_TABS: { id: TabId; label: string }[] = [
  ...COMPANY_TABS,
  { id: 'settings', label: 'Config. NR-1' },
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
  extraTabs,
}: B2BDashboardProps = {}) {
  const session = useB2BSession()

  const companyId = companyIdProp ?? session.companyId
  const companyName = companyNameProp ?? session.companyName

  // In portal mode, fetch cycles via portal API (BB admin has no company_users row)
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
  const cycles = isPortalMode
    ? (portalCycles ?? [])
    : session.cycles

  const [cycleId, setCycleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsString.withDefault('visao-geral')
  )

  useEffect(() => {
    if (currentCycle?.id && !cycleId) {
      setCycleId(currentCycle.id)
    }
  }, [currentCycle?.id, cycleId])

  const { data: overview } = useB2BOverview(companyId, cycleId)
  const { data: compliance } = useB2BCompliance(companyId, cycleId)
  const { data: tracking, isLoading: trackingLoading } =
    useB2BEmployeeTrackingQueryHook(companyId)

  const hasValidGro =
    !!compliance?.groValidUntil &&
    new Date(compliance.groValidUntil) > new Date()

  const visibleTabs = isPortalMode ? PORTAL_TABS : COMPANY_TABS

  // Portal admins always see the full dashboard — gate is for company users only
  const showOnboarding =
    !isPortalMode &&
    !trackingLoading &&
    tracking != null &&
    tracking.completionPct < 30

  const handleSettingsClick = isPortalMode
    ? undefined
    : () => void setActiveTab('settings')

  return (
    <div className="flex min-h-screen flex-col bg-[#07111F]">
      <B2BHeaderComponent
        cycleId={cycleId}
        onCycleChange={setCycleId}
        hasValidGro={hasValidGro}
        complianceCycle={compliance?.cycle ?? null}
        complianceUpdatedAt={compliance?.cycle?.ends_at ?? null}
        companyNameOverride={companyName}
        cyclesOverride={cycles}
        currentCycleOverride={currentCycle}
        hideSignOut={isPortalMode}
        onSettingsClick={handleSettingsClick}
      />

      {showOnboarding ? (
        <div className="flex-1 overflow-auto px-4 py-5 md:px-6">
          <B2BEmployeeTrackingComponent data={tracking} />
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="overflow-x-auto border-b border-[rgba(255,255,255,0.08)] bg-[#0E1E33]">
            <div className="flex gap-1 px-4 md:px-6">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => void setActiveTab(t.id)}
                  className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors md:px-4 md:text-[13px] ${
                    activeTab === t.id
                      ? 'border-[#0D9488] text-[#14B8A6]'
                      : 'border-transparent text-[#64748B] hover:text-[#E2E8F0]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              {extraTabs}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-4 py-5 md:px-6">
            {activeTab === 'visao-geral' && (
              <B2BOverviewTab
                companyId={companyId}
                cycleId={cycleId}
                overview={overview}
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
            {activeTab === 'compliance' && (
              <B2BComplianceTab companyId={companyId} cycleId={cycleId} />
            )}
            {activeTab === 'relatorios' && (
              <B2BReportsTab companyId={companyId} cycleId={cycleId} />
            )}
            {activeTab === 'settings' && (
              <B2BSettingsTab companyId={companyId} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
