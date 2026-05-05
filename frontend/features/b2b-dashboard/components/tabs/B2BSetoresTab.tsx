// frontend/features/b2b-dashboard/components/tabs/B2BSetoresTab.tsx
'use client'

import { useCallback, useMemo, useState } from 'react'

import type {
  B2BDepartmentData,
  DashboardFilters,
  NR1RiskBand,
} from '../../b2b-dashboard.interface'
import { useB2BDepartments } from '../../hooks/useB2BDepartments'
import { B2BFilterBarComponent } from '../shared/B2BFilterBarComponent'

type SortField =
  | 'overall'
  | 'physical'
  | 'ergonomic'
  | 'psychosocial'
  | 'violence'
  | 'actions'
  | 'name'

const NR1_BAND_LABELS: Record<NR1RiskBand, { label: string; color: string }> = {
  baixo: { label: 'Baixo', color: '#22c55e' },
  moderado: { label: 'Moderado', color: '#eab308' },
  alto: { label: 'Alto', color: '#f97316' },
  critico: { label: 'Crítico', color: '#ef4444' },
}

function scoreToBand(score: number | null): NR1RiskBand {
  if (score == null || score < 2) return 'baixo'
  if (score < 3) return 'moderado'
  if (score < 4) return 'alto'
  return 'critico'
}

function scoreColor(value: number | null): string {
  if (value == null) return '#64748b'
  if (value < 2) return '#22c55e'
  if (value < 3) return '#eab308'
  if (value < 4) return '#f97316'
  return '#ef4444'
}

interface B2BSetoresTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BSetoresTab({ companyId, cycleId }: B2BSetoresTabProps) {
  const { data, isLoading } = useB2BDepartments(companyId, cycleId)

  const [sortField, setSortField] = useState<SortField>('overall')
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
      result = result.filter((d) => {
        const band = scoreToBand(d.scoreOverall)
        return filters.riskLevels!.includes(band)
      })
    }

    return result
  }, [departments, filters])

  const sortedDepts = useMemo(() => {
    const sorted = [...filteredDepts]

    const getValue = (d: B2BDepartmentData): number => {
      switch (sortField) {
        case 'overall':
          return d.scoreOverall ?? -1
        case 'physical':
          return d.scorePhysical ?? -1
        case 'ergonomic':
          return d.scoreErgonomic ?? -1
        case 'psychosocial':
          return d.scorePsychosocial ?? -1
        case 'violence':
          return d.scoreViolence ?? -1
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
          <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
            Ref. NR-1: 1.5.7.3.2 — Inventário consolidado por grupo de
            exposição
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-6 py-16 text-center">
          <span className="text-[32px]">🏢</span>
          <h3 className="mt-3 text-[18px] font-semibold text-[#e2e8f0]">
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
      className={`rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors ${
        sortField === field
          ? 'border border-[rgba(197,225,85,0.3)] bg-[rgba(197,225,85,0.15)] text-[#c5e155]'
          : 'border border-[rgba(255,255,255,0.06)] bg-transparent text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)]'
      }`}
    >
      {label} {sortField === field && (sortAsc ? '↑' : '↓')}
    </button>
  )

  function ScoreCell({ value }: { value: number | null }) {
    if (value == null) {
      return <span className="text-[15px] text-[#64748b]">–</span>
    }
    return (
      <span
        className="inline-flex h-[26px] w-[46px] items-center justify-center rounded-md text-[15px] font-bold"
        style={{
          backgroundColor: `${scoreColor(value)}15`,
          color: scoreColor(value),
        }}
      >
        {value.toFixed(1)}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <B2BFilterBarComponent
        availableDepartments={availableDepartments}
        showRiskFilter
        onFiltersChange={handleFiltersChange}
      />

      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">🏢</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            Mapa de Riscos por Setor
          </h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Ref. NR-1: 1.5.7.3.2 — Inventário consolidado por grupo de exposição
        </p>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-[14px] font-medium text-[#64748b]">
            Ordenar por:
          </span>
          {sortButton('overall', 'Overall')}
          {sortButton('physical', 'Físico')}
          {sortButton('ergonomic', 'Ergonômico')}
          {sortButton('psychosocial', 'Psicossocial')}
          {sortButton('violence', 'Violência')}
          {sortButton('actions', 'Ações')}
        </div>

        <table className="w-full min-w-[700px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)] border-t border-t-[rgba(255,255,255,0.04)]">
              <th className="px-4 py-2.5 text-left text-[13px] font-medium uppercase tracking-wider text-[#64748b]">
                Setor
              </th>
              <th className="px-3 py-2.5 text-center text-[13px] font-medium uppercase tracking-wider text-[#64748b]">
                Nº Aval.
              </th>
              <th className="px-3 py-2.5 text-center text-[13px] font-medium uppercase tracking-wider text-[#64748b]">
                Físico
              </th>
              <th className="px-3 py-2.5 text-center text-[13px] font-medium uppercase tracking-wider text-[#64748b]">
                Ergonômico
              </th>
              <th className="px-3 py-2.5 text-center text-[13px] font-medium uppercase tracking-wider text-[#64748b]">
                Psicossocial
              </th>
              <th className="px-3 py-2.5 text-center text-[13px] font-medium uppercase tracking-wider text-[#64748b]">
                Violência
              </th>
              <th className="px-3 py-2.5 text-center text-[13px] font-medium uppercase tracking-wider text-[#64748b]">
                Overall
              </th>
              <th className="px-3 py-2.5 text-center text-[13px] font-medium uppercase tracking-wider text-[#64748b]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDepts.map((d) => {
              const band = scoreToBand(d.scoreOverall)
              const bandCfg = NR1_BAND_LABELS[band]
              return (
                <tr
                  key={d.name}
                  className="border-b border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(255,255,255,0.02)] last:border-0"
                >
                  <td className="px-4 py-3 text-[14px] font-medium text-[#e2e8f0]">
                    <div className="flex items-center gap-2">
                      {d.name}
                      <span
                        className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${bandCfg.color}20`,
                          color: bandCfg.color,
                        }}
                      >
                        {bandCfg.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-[15px] text-[#94a3b8]">
                    {d.n}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ScoreCell value={d.scorePhysical} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ScoreCell value={d.scoreErgonomic} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ScoreCell value={d.scorePsychosocial} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ScoreCell value={d.scoreViolence} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ScoreCell value={d.scoreOverall} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    {d.pendingActions > 0 ? (
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-[rgba(245,158,11,0.15)] px-2 text-[14px] font-bold text-[#FBBF24]">
                        {d.pendingActions}
                      </span>
                    ) : (
                      <span className="text-[15px] text-[#64748b]">–</span>
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
