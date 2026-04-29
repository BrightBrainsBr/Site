// frontend/features/b2b-dashboard/components/tabs/B2BAvaliacoesTab.tsx
'use client'

import { useState } from 'react'

import type { AvaliacaoIndividual } from '../../hooks/useB2BAvaliacoesQueryHook'
import { useB2BAvaliacoesQueryHook } from '../../hooks/useB2BAvaliacoesQueryHook'

interface Props {
  companyId: string | null
  cycleId: string | null
}

const BAND_CONFIG = {
  baixo: { label: 'Baixo', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  moderado: { label: 'Moderado', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  alto: { label: 'Alto', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  critico: { label: 'Crítico', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
} as const

const DOMAIN_LABELS: Record<string, string> = {
  scorePhysical: 'Físico',
  scoreErgonomic: 'Ergon.',
  scorePsychosocial: 'Psicossoc.',
  scoreViolence: 'Violência',
}

function ScoreBar({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value == null) return <span className="text-[12px] text-[#475569]">—</span>
  const pct = Math.min((value / max) * 100, 100)
  const color = value < 2 ? '#22c55e' : value < 3 ? '#eab308' : value < 4 ? '#f97316' : '#ef4444'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-mono" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  )
}

function AvaliacaoRow({ av }: { av: AvaliacaoIndividual }) {
  const [expanded, setExpanded] = useState(false)
  const band = av.riskBand ? BAND_CONFIG[av.riskBand] : null
  const dateStr = new Date(av.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const psycEntries = Object.entries(av.psychosocial).filter(([, v]) => v != null)

  return (
    <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] transition-colors hover:border-[rgba(255,255,255,0.1)]">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar initials */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(197,225,85,0.1)] text-[13px] font-bold text-[#c5e155]">
          {av.employeeName
            ? av.employeeName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
            : '?'}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#e2e8f0]">
            {av.employeeName ?? av.employeeEmail ?? 'Anônimo'}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0 text-[12px] text-[#64748b]">
            {av.department && <span>{av.department}</span>}
            <span>{dateStr}</span>
          </div>
        </div>

        {/* Domain scores — hidden on small screens */}
        <div className="hidden items-center gap-4 sm:flex">
          {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
            <div key={key} className="text-center">
              <p className="text-[10px] text-[#475569]">{label}</p>
              <ScoreBar value={av[key as keyof AvaliacaoIndividual] as number | null} />
            </div>
          ))}
        </div>

        {/* Risk band badge */}
        {band && (
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
            style={{ color: band.color, backgroundColor: band.bg }}
          >
            {band.label}
          </span>
        )}

        <span className={`shrink-0 text-[#64748b] transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Expanded psychosocial details */}
      {expanded && psycEntries.length > 0 && (
        <div className="border-t border-[rgba(255,255,255,0.06)] px-4 pb-4 pt-3">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#475569]">
            Eixos Psicossociais
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            {psycEntries.map(([key, value]) => (
              <div key={key}>
                <p className="text-[11px] capitalize text-[#64748b]">
                  {key === 'workload' ? 'Carga de Trabalho' :
                   key === 'pace' ? 'Ritmo' :
                   key === 'autonomy' ? 'Autonomia' :
                   key === 'leadership' ? 'Liderança' :
                   key === 'relationships' ? 'Relações' :
                   key === 'recognition' ? 'Reconhecimento' :
                   key === 'clarity' ? 'Clareza' :
                   key === 'balance' ? 'Equilíbrio' : key}
                </p>
                <ScoreBar value={value as number | null} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function B2BAvaliacoesTab({ companyId, cycleId }: Props) {
  const [search, setSearch] = useState('')
  const [filterBand, setFilterBand] = useState('')
  const [filterDept, setFilterDept] = useState('')

  const { data, isLoading } = useB2BAvaliacoesQueryHook(companyId, cycleId)

  const evaluations = data?.evaluations ?? []

  const departments = [...new Set(evaluations.map((e) => e.department).filter(Boolean))] as string[]

  const filtered = evaluations.filter((av) => {
    const q = search.toLowerCase()
    if (q) {
      const name = (av.employeeName ?? '').toLowerCase()
      const email = (av.employeeEmail ?? '').toLowerCase()
      const dept = (av.department ?? '').toLowerCase()
      if (!name.includes(q) && !email.includes(q) && !dept.includes(q)) return false
    }
    if (filterBand && av.riskBand !== filterBand) return false
    if (filterDept && av.department !== filterDept) return false
    return true
  })

  const bandCounts = evaluations.reduce((acc, av) => {
    if (av.riskBand) acc[av.riskBand] = (acc[av.riskBand] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[15px] text-[#64748b]">
        Carregando avaliações…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">📝</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">Avaliações Individuais</h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Respostas individuais dos colaboradores — {data?.total ?? 0} avaliações no ciclo
        </p>
      </div>

      {/* Summary by risk band */}
      {evaluations.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.entries(BAND_CONFIG) as [string, typeof BAND_CONFIG[keyof typeof BAND_CONFIG]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterBand((prev) => (prev === key ? '' : key))}
              className={`rounded-[12px] border p-3 text-left transition-colors ${
                filterBand === key
                  ? 'border-[rgba(255,255,255,0.2)]'
                  : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
              } bg-[#0c1425]`}
            >
              <p className="text-[13px] text-[#94a3b8]">{cfg.label}</p>
              <p className="mt-0.5 text-[24px] font-bold" style={{ color: cfg.color }}>
                {bandCounts[key] ?? 0}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex min-w-[200px] flex-1 items-center">
          <svg className="absolute left-2.5 h-3.5 w-3.5 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou setor…"
            className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0c1425] py-1.5 pl-8 pr-3 text-[13px] text-[#e2e8f0] outline-none placeholder:text-[#64748b] focus:border-[rgba(197,225,85,0.3)]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 text-[#64748b] hover:text-[#94a3b8]">✕</button>
          )}
        </div>

        {/* Dept filter */}
        {departments.length > 0 && (
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0c1425] px-3 py-1.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
          >
            <option value="">Todos os setores</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}

        {(filterBand || filterDept || search) && (
          <button
            onClick={() => { setFilterBand(''); setFilterDept(''); setSearch('') }}
            className="text-[13px] text-[#64748b] underline hover:text-[#94a3b8]"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] text-[15px] text-[#64748b]">
          {evaluations.length === 0 ? 'Nenhuma avaliação encontrada neste ciclo' : 'Nenhum resultado para os filtros selecionados'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((av) => (
            <AvaliacaoRow key={av.id} av={av} />
          ))}
        </div>
      )}
    </div>
  )
}
