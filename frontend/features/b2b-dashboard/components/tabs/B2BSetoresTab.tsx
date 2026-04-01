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
  low: { label: 'Baixo', color: '#10B981' },
  moderate: { label: 'Moderado', color: '#F59E0B' },
  elevated: { label: 'Elevado', color: '#F97316' },
  critical: { label: 'Crítico', color: '#EF4444' },
}

const RISK_PT_MAP: Record<string, RiskLevel> = {
  baixo: 'low',
  moderado: 'moderate',
  elevado: 'elevated',
  critico: 'critical',
}

function scoreColor(value: number | null): string {
  if (value === null) return '#64748B'
  const normalized = value
  if (normalized < 40) return '#10B981'
  if (normalized < 60) return '#F59E0B'
  if (normalized < 80) return '#F97316'
  return '#EF4444'
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
      </div>
    )
  }

  const sortButton = (field: SortField, label: string) => (
    <button
      onClick={() => handleSort(field)}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        sortField === field
          ? 'bg-[rgba(20,184,166,0.2)] text-[#14B8A6]'
          : 'bg-[rgba(255,255,255,0.06)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.1)]'
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

      <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33]">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-[11px] font-medium text-[#64748B]">
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
            <tr className="border-b border-[rgba(255,255,255,0.08)] border-t border-t-[rgba(255,255,255,0.04)]">
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                Setor
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                Colabs
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                Risco
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                Score
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                PHQ-9
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                GAD-7
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                SRQ-20
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                AEP/56
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
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
                  <td className="px-4 py-2.5 text-[12px] font-medium text-[#E2E8F0]">
                    {d.name}
                  </td>
                  <td className="px-2 py-2.5 text-center text-[#94A3B8]">
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
                      <span className="text-[#64748B]">–</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sortedDepts.length === 0 && (
          <p className="py-12 text-center text-[13px] text-[#64748B]">
            Nenhum setor encontrado com os filtros selecionados.
          </p>
        )}
      </div>
    </div>
  )
}
