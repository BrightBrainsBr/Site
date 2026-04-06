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

function normalizedScoreColor(value: number | null): string {
  if (value === null) return '#64748b'
  if (value >= 70) return '#22c55e'
  if (value >= 60) return '#eab308'
  if (value >= 45) return '#f97316'
  return '#ef4444'
}

function srq20Color(value: number | null): string {
  if (value === null) return '#64748b'
  if (value >= 12) return '#ef4444'
  if (value >= 8) return '#f97316'
  if (value >= 5) return '#eab308'
  return '#22c55e'
}

function aepColor(value: number | null): string {
  if (value === null) return '#64748b'
  if (value >= 29) return '#ef4444'
  if (value >= 20) return '#f97316'
  if (value >= 12) return '#eab308'
  return '#22c55e'
}

function phqGadColor(value: number | null): string {
  if (value === null) return '#64748b'
  if (value >= 15) return '#ef4444'
  if (value >= 10) return '#f97316'
  if (value >= 5) return '#eab308'
  return '#22c55e'
}

function dominantRisk(rb: Record<RiskLevel, number>): RiskLevel {
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

  const hasPhq9 = useMemo(
    () => departments.some((d) => d.phq9Avg != null),
    [departments]
  )
  const hasGad7 = useMemo(
    () => departments.some((d) => d.gad7Avg != null),
    [departments]
  )
  const hasSrq20 = useMemo(
    () => departments.some((d) => d.srq20Avg != null),
    [departments]
  )
  const hasAep = useMemo(
    () => departments.some((d) => d.aepAvg != null),
    [departments]
  )

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

  if (departments.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[20px]">🏢</span>
            <h2 className="text-[20px] font-bold text-[#e2e8f0]">
              Mapa de Riscos por Setor
            </h2>
          </div>
          <p className="mt-0.5 pl-[28px] text-[13px] text-[#64748b]">
            Ref. NR-1: 1.5.7.3.2 — Inventário consolidado por grupo de
            exposição
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-6 py-16 text-center">
          <span className="text-[32px]">🏢</span>
          <h3 className="mt-3 text-[16px] font-semibold text-[#e2e8f0]">
            Nenhum setor com avaliações neste ciclo
          </h3>
          <p className="mt-2 max-w-md text-[14px] text-[#94a3b8]">
            O mapa de riscos por setor é gerado automaticamente a partir das
            avaliações dos colaboradores. Mínimo de 10 avaliações recomendado.
          </p>
        </div>
      </div>
    )
  }

  const sortButton = (field: SortField, label: string) => (
    <button
      onClick={() => handleSort(field)}
      className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
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
          <span className="text-[20px]">🏢</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            Mapa de Riscos por Setor
          </h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[13px] text-[#64748b]">
          Ref. NR-1: 1.5.7.3.2 — Inventário consolidado por grupo de exposição
        </p>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-[12px] font-medium text-[#64748b]">
            Ordenar por:
          </span>
          {sortButton('score', 'Score Global')}
          {hasPhq9 && sortButton('phq9', 'PHQ-9')}
          {hasGad7 && sortButton('gad7', 'GAD-7')}
          {hasSrq20 && sortButton('srq20', 'SRQ-20')}
          {hasAep && sortButton('aep', 'AEP')}
          {sortButton('actions', 'Ações Pendentes')}
        </div>

        <table className="w-full min-w-[700px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)] border-t border-t-[rgba(255,255,255,0.04)]">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                Setor
              </th>
              <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                Colabs
              </th>
              <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                Risco
              </th>
              <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                Score
              </th>
              {hasPhq9 && (
                <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                  PHQ-9
                </th>
              )}
              {hasGad7 && (
                <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                  GAD-7
                </th>
              )}
              {hasSrq20 && (
                <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                  SRQ-20
                </th>
              )}
              {hasAep && (
                <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                  AEP/56
                </th>
              )}
              <th className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
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
                  <td className="px-4 py-3 text-[14px] font-medium text-[#e2e8f0]">
                    {d.name}
                  </td>
                  <td className="px-3 py-3 text-center text-[13px] text-[#94a3b8]">
                    {d.n}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className="inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${riskCfg.color}20`,
                        color: riskCfg.color,
                      }}
                    >
                      {riskCfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className="inline-flex h-[26px] w-[46px] items-center justify-center rounded-md text-[13px] font-bold"
                      style={{
                        backgroundColor: `${normalizedScoreColor(d.avgScore)}15`,
                        color: normalizedScoreColor(d.avgScore),
                      }}
                    >
                      {d.avgScore.toFixed(1)}
                    </span>
                  </td>
                  {hasPhq9 && (
                    <td className="px-3 py-3 text-center text-[13px]">
                      <span style={{ color: phqGadColor(d.phq9Avg) }}>
                        {d.phq9Avg?.toFixed(1) ?? '–'}
                      </span>
                    </td>
                  )}
                  {hasGad7 && (
                    <td className="px-3 py-3 text-center text-[13px]">
                      <span style={{ color: phqGadColor(d.gad7Avg) }}>
                        {d.gad7Avg?.toFixed(1) ?? '–'}
                      </span>
                    </td>
                  )}
                  {hasSrq20 && (
                    <td className="px-3 py-3 text-center text-[13px]">
                      <span style={{ color: srq20Color(d.srq20Avg) }}>
                        {d.srq20Avg?.toFixed(1) ?? '–'}
                      </span>
                    </td>
                  )}
                  {hasAep && (
                    <td className="px-3 py-3 text-center text-[13px]">
                      <span style={{ color: aepColor(d.aepAvg) }}>
                        {d.aepAvg?.toFixed(1) ?? '–'}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-3 text-center">
                    {d.pendingActions > 0 ? (
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-[rgba(245,158,11,0.15)] px-2 text-[12px] font-bold text-[#FBBF24]">
                        {d.pendingActions}
                      </span>
                    ) : (
                      <span className="text-[13px] text-[#64748b]">–</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sortedDepts.length === 0 && (
          <p className="py-12 text-center text-[14px] text-[#64748b]">
            Nenhum setor encontrado com os filtros selecionados.
          </p>
        )}
      </div>
    </div>
  )
}
