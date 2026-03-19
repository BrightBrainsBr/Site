'use client'

import { useEffect, useState } from 'react'

import { B2BHeaderComponent } from './B2BHeaderComponent'
import { B2BKpiRowComponent } from './B2BKpiRowComponent'
import { B2BAlertsTab } from './tabs/B2BAlertsTab'
import { B2BComplianceTab } from './tabs/B2BComplianceTab'
import { B2BDomainsTab } from './tabs/B2BDomainsTab'
import { B2BOverviewTab } from './tabs/B2BOverviewTab'
import { B2BReportsTab } from './tabs/B2BReportsTab'
import { B2BRiskMapTab } from './tabs/B2BRiskMapTab'
import { useB2BCompliance } from '../hooks/useB2BCompliance'
import { useB2BOverview } from '../hooks/useB2BOverview'
import { useB2BSession } from '../hooks/useB2BSession'

type TabId = 'overview' | 'risk' | 'domains' | 'compliance' | 'alerts' | 'reports'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'risk', label: 'Mapa de Risco' },
  { id: 'domains', label: 'Domínios Cognitivos' },
  { id: 'compliance', label: 'Conformidade NR-1' },
  { id: 'alerts', label: 'Alertas & Prioridades' },
  { id: 'reports', label: 'Relatórios' },
]

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
  const currentCycle = isPortalMode ? null : session.currentCycle
  const cycles = isPortalMode ? [] : session.cycles

  const [cycleId, setCycleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  useEffect(() => {
    if (currentCycle?.id && !cycleId) {
      setCycleId(currentCycle.id)
    }
  }, [currentCycle?.id, cycleId])

  const { data: overview, isLoading: overviewLoading } = useB2BOverview(
    companyId,
    cycleId
  )
  const { data: compliance } = useB2BCompliance(companyId, cycleId)

  const hasValidGro =
    !!compliance?.groValidUntil &&
    new Date(compliance.groValidUntil) > new Date()

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
      />

      {/* KPI row */}
      <div className="px-6 py-4">
        <B2BKpiRowComponent
          data={overview}
          complianceData={compliance}
          isLoading={overviewLoading}
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
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

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {activeTab === 'overview' && (
          <B2BOverviewTab
            companyId={companyId}
            cycleId={cycleId}
            overview={overview}
          />
        )}
        {activeTab === 'risk' && (
          <B2BRiskMapTab companyId={companyId} cycleId={cycleId} />
        )}
        {activeTab === 'domains' && (
          <B2BDomainsTab companyId={companyId} cycleId={cycleId} />
        )}
        {activeTab === 'compliance' && (
          <B2BComplianceTab companyId={companyId} cycleId={cycleId} />
        )}
        {activeTab === 'alerts' && (
          <B2BAlertsTab companyId={companyId} cycleId={cycleId} />
        )}
        {activeTab === 'reports' && (
          <B2BReportsTab companyId={companyId} cycleId={cycleId} />
        )}
      </div>
    </div>
  )
}
