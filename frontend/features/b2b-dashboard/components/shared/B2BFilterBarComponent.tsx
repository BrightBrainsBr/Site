// frontend/features/b2b-dashboard/components/shared/B2BFilterBarComponent.tsx
'use client'

import { X } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { DashboardFilters } from '../../b2b-dashboard.interface'

const RISK_OPTIONS = [
  { value: 'baixo', label: 'Baixo', color: '#10B981' },
  { value: 'moderado', label: 'Moderado', color: '#F59E0B' },
  { value: 'elevado', label: 'Elevado', color: '#F97316' },
  { value: 'critico', label: 'Crítico', color: '#EF4444' },
] as const

const INSTRUMENT_OPTIONS = [
  { value: 'phq9', label: 'PHQ-9' },
  { value: 'gad7', label: 'GAD-7' },
  { value: 'srq20', label: 'SRQ-20' },
  { value: 'aep_total', label: 'AEP' },
] as const

interface FilterBarProps {
  availableDepartments: string[]
  showRiskFilter?: boolean
  showDateFilter?: boolean
  showInstrumentFilter?: boolean
  onFiltersChange: (filters: DashboardFilters) => void
}

export function B2BFilterBarComponent({
  availableDepartments,
  showRiskFilter = true,
  showDateFilter = false,
  showInstrumentFilter = false,
  onFiltersChange,
}: FilterBarProps) {
  const [deptParam, setDeptParam] = useQueryState(
    'dept',
    parseAsString.withDefault('')
  )
  const [riskParam, setRiskParam] = useQueryState(
    'risk',
    parseAsString.withDefault('')
  )
  const [fromParam, setFromParam] = useQueryState(
    'from',
    parseAsString.withDefault('')
  )
  const [toParam, setToParam] = useQueryState(
    'to',
    parseAsString.withDefault('')
  )
  const [instrumentParam, setInstrumentParam] = useQueryState(
    'instrument',
    parseAsString.withDefault('')
  )

  const [isExpanded, setIsExpanded] = useState(false)

  const selectedDepts = useMemo(
    () => (deptParam ? deptParam.split(',').filter(Boolean) : []),
    [deptParam]
  )
  const selectedRisks = useMemo(
    () => (riskParam ? riskParam.split(',').filter(Boolean) : []),
    [riskParam]
  )

  const filters: DashboardFilters = useMemo(
    () => ({
      departments: selectedDepts.length > 0 ? selectedDepts : undefined,
      riskLevels: selectedRisks.length > 0 ? selectedRisks : undefined,
      dateFrom: fromParam || undefined,
      dateTo: toParam || undefined,
      instrument: instrumentParam || undefined,
    }),
    [selectedDepts, selectedRisks, fromParam, toParam, instrumentParam]
  )

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const toggleDept = useCallback(
    (dept: string) => {
      const next = selectedDepts.includes(dept)
        ? selectedDepts.filter((d) => d !== dept)
        : [...selectedDepts, dept]
      void setDeptParam(next.length > 0 ? next.join(',') : '')
    },
    [selectedDepts, setDeptParam]
  )

  const toggleRisk = useCallback(
    (risk: string) => {
      const next = selectedRisks.includes(risk)
        ? selectedRisks.filter((r) => r !== risk)
        : [...selectedRisks, risk]
      void setRiskParam(next.length > 0 ? next.join(',') : '')
    },
    [selectedRisks, setRiskParam]
  )

  const clearAll = useCallback(() => {
    void setDeptParam('')
    void setRiskParam('')
    void setFromParam('')
    void setToParam('')
    void setInstrumentParam('')
  }, [setDeptParam, setRiskParam, setFromParam, setToParam, setInstrumentParam])

  const hasActiveFilters =
    selectedDepts.length > 0 ||
    selectedRisks.length > 0 ||
    !!fromParam ||
    !!toParam ||
    !!instrumentParam

  const activeCount =
    selectedDepts.length +
    selectedRisks.length +
    (fromParam ? 1 : 0) +
    (toParam ? 1 : 0) +
    (instrumentParam ? 1 : 0)

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#E2E8F0]"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtros
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0D9488] text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {hasActiveFilters && !isExpanded && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedDepts.map((dept) => (
              <span
                key={dept}
                className="flex items-center gap-1 rounded-full bg-[rgba(20,184,166,0.15)] px-2 py-0.5 text-[11px] text-[#14B8A6]"
              >
                {dept}
                <button onClick={() => toggleDept(dept)} className="ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedRisks.map((risk) => {
              const opt = RISK_OPTIONS.find((o) => o.value === risk)
              return (
                <span
                  key={risk}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                  style={{
                    backgroundColor: `${opt?.color ?? '#64748B'}20`,
                    color: opt?.color ?? '#64748B',
                  }}
                >
                  {opt?.label ?? risk}
                  <button onClick={() => toggleRisk(risk)} className="ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
            {instrumentParam && (
              <span className="flex items-center gap-1 rounded-full bg-[rgba(59,130,246,0.15)] px-2 py-0.5 text-[11px] text-[#3B82F6]">
                {INSTRUMENT_OPTIONS.find((o) => o.value === instrumentParam)
                  ?.label ?? instrumentParam}
                <button
                  onClick={() => void setInstrumentParam('')}
                  className="ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="ml-auto text-[11px] text-[#64748B] transition-colors hover:text-[#F87171]"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-[rgba(255,255,255,0.06)] pt-3">
          {availableDepartments.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                Departamentos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableDepartments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => toggleDept(dept)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      selectedDepts.includes(dept)
                        ? 'bg-[#0D9488] text-white'
                        : 'bg-[rgba(255,255,255,0.06)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showRiskFilter && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                Nível de Risco
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RISK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleRisk(opt.value)}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                    style={
                      selectedRisks.includes(opt.value)
                        ? {
                            backgroundColor: `${opt.color}30`,
                            color: opt.color,
                          }
                        : {
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            color: '#94A3B8',
                          }
                    }
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showInstrumentFilter && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                Instrumento
              </p>
              <div className="flex flex-wrap gap-1.5">
                {INSTRUMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      void setInstrumentParam(
                        instrumentParam === opt.value ? '' : opt.value
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      instrumentParam === opt.value
                        ? 'bg-[rgba(59,130,246,0.3)] text-[#3B82F6]'
                        : 'bg-[rgba(255,255,255,0.06)] text-[#94A3B8] hover:bg-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showDateFilter && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                Período
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromParam}
                  onChange={(e) => void setFromParam(e.target.value)}
                  className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0A1628] px-2.5 py-1.5 text-[12px] text-[#E2E8F0] focus:border-[#14B8A6] focus:outline-none"
                />
                <span className="text-[11px] text-[#64748B]">até</span>
                <input
                  type="date"
                  value={toParam}
                  onChange={(e) => void setToParam(e.target.value)}
                  className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0A1628] px-2.5 py-1.5 text-[12px] text-[#E2E8F0] focus:border-[#14B8A6] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
