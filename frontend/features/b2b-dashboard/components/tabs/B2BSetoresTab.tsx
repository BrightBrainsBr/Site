// frontend/features/b2b-dashboard/components/tabs/B2BSetoresTab.tsx
'use client'

import { useCallback, useMemo, useState } from 'react'

import type {
  B2BDepartmentData,
  DashboardFilters,
  RiskLevel,
} from '../../b2b-dashboard.interface'
import { useB2BDepartments } from '../../hooks/useB2BDepartments'
import { B2BFilterBarComponent } from '../shared/B2BFilterBarComponent'

type SortField =
  | 'score'
  | 'phq9'
  | 'gad7'
  | 'srq20'
  | 'aep'
  | 'actions'
  | 'name'

const RISK_LABEL: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: 'Baixo', color: '#22c55e' },
  moderate: { label: 'Moderado', color: '#eab308' },
  elevated: { label: 'Elevado', color: '#f97316' },
  critical: { label: 'Crítico', color: '#ef4444' },
}

const RISK_PT_MAP: Record<string, RiskLevel> = {
  baixo: 'low',
  moderado: 'moderate',
  elevado: 'elevated',
  critico: 'critical',
}

function scoreColor(value: number | null): string {
  if (value === null) return '#64748b'
  const normalized = value
  if (normalized < 40) return '#22c55e'
  if (normalized < 60) return '#eab308'
  if (normalized < 80) return '#f97316'
  return '#ef4444'
}

function dominantRisk(
  rb: Record<RiskLevel, number>
): RiskLevel {
  if (rb.critical > 0) return 'critical'
  if (rb.elevated > 0) return 'elevated'
  if (rb.moderate > 0) return 'moderate'
  return 'low'
}

interface B2BSetoresTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BSetoresTab({ companyId, cycleId }: B2BSetoresTabProps) {
  const { data, isLoading } = useB2BDepartments(companyId, cycleId)

  const [sortField, setSortField] = useState<SortField>('score')
  const [sortAsc, setSortAsc] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>({})

  const handleFiltersChange = useCallback((f: DashboardFilters) => {
    setFilters(f)
  }, [])

  const departments = data?.departments ?? []

  const availableDepartments = useMemo(
    () => departments.map((d) => d.name),
    [departments]
  )

  const filteredDepts = useMemo(() => {
    let result = departments

    if (filters.departments && filters.departments.length > 0) {
      result = result.filter((d) => filters.departments!.includes(d.name))
    }

    if (filters.riskLevels && filters.riskLevels.length > 0) {
      const mappedLevels = filters.riskLevels
        .map((r) => RISK_PT_MAP[r])
        .filter(Boolean)
      result = result.filter((d) => {
        const dom = dominantRisk(d.riskBreakdown)
        return mappedLevels.includes(dom)
      })
    }

    return result
  }, [departments, filters])

  const sortedDepts = useMemo(() => {
    const sorted = [...filteredDepts]

    const getValue = (d: B2BDepartmentData): number => {
      switch (sortField) {
        case 'score':
          return d.avgScore
        case 'phq9':
          return d.phq9Avg ?? -1
        case 'gad7':
          return d.gad7Avg ?? -1
        case 'srq20':
          return d.srq20Avg ?? -1
        case 'aep':
          return d.aepAvg ?? -1
        case 'actions':
          return d.pendingActions
        case 'name':
          return 0
      }
    }

    sorted.sort((a, b) => {
      if (sortField === 'name') {
        return sortAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      }
      const diff = getValue(a) - getValue(b)
      return sortAsc ? diff : -diff
    })

    return sorted
  }, [filteredDepts, sortField, sortAsc])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c5e155] border-t-transparent" />
      </div>
    )
  }

  const sortButton = (field: SortField, label: string) => (
    <button
      onClick={() => handleSort(field)}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        sortField === field
          ? 'border border-[rgba(197,225,85,0.3)] bg-[rgba(197,225,85,0.15)] text-[#c5e155]'
          : 'border border-[rgba(255,255,255,0.06)] bg-transparent text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)]'
      }`}
    >
      {label} {sortField === field && (sortAsc ? '↑' : '↓')}
    </button>
  )

  return (
    <div className="space-y-4">
      <B2BFilterBarComponent
        availableDepartments={availableDepartments}
        showRiskFilter
        showInstrumentFilter
        onFiltersChange={handleFiltersChange}
      />

      <div>
        <div className="flex items-center gap-2">
          <span className="text-[18px]">🏢</span>
          <h2 className="text-[18px] font-bold text-[#e2e8f0]">Mapa de Riscos por Setor</h2>
        </div>
        <p className="mt-0.5 pl-[26px] text-[12px] text-[#64748b]">Ref. NR-1: 1.5.7.3.2 — Inventário consolidado por grupo de exposição</p>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-[11px] font-medium text-[#64748b]">
            Ordenar por:
          </span>
          {sortButton('score', 'Score Global')}
          {sortButton('phq9', 'PHQ-9')}
          {sortButton('gad7', 'GAD-7')}
          {sortButton('srq20', 'SRQ-20')}
          {sortButton('aep', 'AEP')}
          {sortButton('actions', 'Ações Pendentes')}
        </div>

        <table className="w-full min-w-[900px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)] border-t border-t-[rgba(255,255,255,0.04)]">
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                Setor
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                Colabs
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                Risco
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                Score
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                PHQ-9
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                GAD-7
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                SRQ-20
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                AEP/56
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDepts.map((d) => {
              const risk = dominantRisk(d.riskBreakdown)
              const riskCfg = RISK_LABEL[risk]
              return (
                <tr
                  key={d.name}
                  className="border-b border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(255,255,255,0.02)] last:border-0"
                >
                  <td className="px-4 py-2.5 text-[12px] font-medium text-[#e2e8f0]">
                    {d.name}
                  </td>
                  <td className="px-2 py-2.5 text-center text-[#94a3b8]">
                    {d.n}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${riskCfg.color}20`,
                        color: riskCfg.color,
                      }}
                    >
                      {riskCfg.label}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span
                      className="inline-flex h-[22px] w-[42px] items-center justify-center rounded-md text-[11px] font-bold"
                      style={{
                        backgroundColor: `${scoreColor(d.avgScore)}15`,
                        color: scoreColor(d.avgScore),
                      }}
                    >
                      {d.avgScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span style={{ color: scoreColor(d.phq9Avg) }}>
                      {d.phq9Avg?.toFixed(1) ?? '–'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span style={{ color: scoreColor(d.gad7Avg) }}>
                      {d.gad7Avg?.toFixed(1) ?? '–'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span style={{ color: scoreColor(d.srq20Avg) }}>
                      {d.srq20Avg?.toFixed(1) ?? '–'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span style={{ color: scoreColor(d.aepAvg) }}>
                      {d.aepAvg?.toFixed(1) ?? '–'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {d.pendingActions > 0 ? (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[rgba(245,158,11,0.15)] px-1.5 text-[10px] font-bold text-[#FBBF24]">
                        {d.pendingActions}
                      </span>
                    ) : (
                      <span className="text-[#64748b]">–</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sortedDepts.length === 0 && (
          <p className="py-12 text-center text-[13px] text-[#64748b]">
            Nenhum setor encontrado com os filtros selecionados.
          </p>
        )}
      </div>
    </div>
  )
}
