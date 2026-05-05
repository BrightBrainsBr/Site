// frontend/features/b2b-dashboard/components/tabs/B2BDenunciasTab.tsx
'use client'

import { useMemo, useState } from 'react'

import type {
  AnonymousReport,
  AnonymousReportFilter,
} from '../../hooks/useB2BDenunciasQueryHook'
import { useB2BDenunciasQueryHook } from '../../hooks/useB2BDenunciasQueryHook'

interface Props {
  companyId: string | null
  cycleId: string | null
}

const TYPE_CONFIG: Record<
  'harassment' | 'general',
  { label: string; icon: string; color: string; bg: string }
> = {
  harassment: {
    label: 'Assédio / Violência',
    icon: '🚨',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
  },
  general: {
    label: 'Denúncia / Risco',
    icon: '🔒',
    color: '#a99df7',
    bg: 'rgba(124,106,247,0.12)',
  },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ReportCard({ report }: { report: AnonymousReport }) {
  const cfg = TYPE_CONFIG[report.reportType]
  return (
    <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
          style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
          <span>{cfg.icon}</span>
          {cfg.label}
        </span>
        {report.department && (
          <span className="rounded-full bg-[rgba(255,255,255,0.04)] px-2 py-0.5 text-[12px] text-[#94a3b8]">
            {report.department}
          </span>
        )}
        <span className="ml-auto text-[12px] text-[#64748b]">
          {formatDate(report.createdAt)}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#e2e8f0]">
        {report.description}
      </p>
    </div>
  )
}

export function B2BDenunciasTab({ companyId, cycleId }: Props) {
  const [filter, setFilter] = useState<AnonymousReportFilter>('all')
  const [filterDept, setFilterDept] = useState('')

  const { data, isLoading, error } = useB2BDenunciasQueryHook(
    companyId,
    cycleId,
    filter
  )

  const reports = data?.reports ?? []
  const totals = data?.totals ?? { all: 0, harassment: 0, general: 0 }

  const departments = useMemo(
    () =>
      Array.from(
        new Set(reports.map((r) => r.department).filter(Boolean))
      ) as string[],
    [reports]
  )

  const filtered = filterDept
    ? reports.filter((r) => r.department === filterDept)
    : reports

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">🔒</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            Denúncias Anônimas
          </h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Relatos enviados anonimamente pelos colaboradores no questionário NR-1.
          Nenhuma informação identifica o autor.
        </p>
      </div>

      <div className="rounded-[12px] border border-[rgba(124,106,247,0.2)] bg-[rgba(124,106,247,0.06)] p-3">
        <p className="text-[13px] text-[#cbd5e1]">
          <span className="font-semibold text-[#a99df7]">Sigilo garantido:</span>{' '}
          os relatos são gravados sem nome, e-mail ou IP. O setor é mantido
          quando disponível para apoiar a triagem; nenhuma outra informação que
          identifique o autor é armazenada.
        </p>
      </div>

      {/* Tabs by type */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-[12px] border p-3 text-left transition-colors ${
            filter === 'all'
              ? 'border-[rgba(255,255,255,0.2)]'
              : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
          } bg-[#0c1425]`}
        >
          <p className="text-[13px] text-[#94a3b8]">Todos</p>
          <p className="mt-0.5 text-[24px] font-bold text-[#e2e8f0]">
            {totals.all}
          </p>
        </button>
        <button
          onClick={() => setFilter('harassment')}
          className={`rounded-[12px] border p-3 text-left transition-colors ${
            filter === 'harassment'
              ? 'border-[rgba(255,255,255,0.2)]'
              : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
          } bg-[#0c1425]`}
        >
          <p className="text-[13px] text-[#94a3b8]">
            {TYPE_CONFIG.harassment.icon} Assédio / Violência
          </p>
          <p
            className="mt-0.5 text-[24px] font-bold"
            style={{ color: TYPE_CONFIG.harassment.color }}
          >
            {totals.harassment}
          </p>
        </button>
        <button
          onClick={() => setFilter('general')}
          className={`rounded-[12px] border p-3 text-left transition-colors ${
            filter === 'general'
              ? 'border-[rgba(255,255,255,0.2)]'
              : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
          } bg-[#0c1425]`}
        >
          <p className="text-[13px] text-[#94a3b8]">
            {TYPE_CONFIG.general.icon} Denúncia / Risco
          </p>
          <p
            className="mt-0.5 text-[24px] font-bold"
            style={{ color: TYPE_CONFIG.general.color }}
          >
            {totals.general}
          </p>
        </button>
      </div>

      {/* Dept filter */}
      {departments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0c1425] px-3 py-1.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
          >
            <option value="">Todos os setores</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {filterDept && (
            <button
              onClick={() => setFilterDept('')}
              className="text-[13px] text-[#64748b] underline hover:text-[#94a3b8]"
            >
              Limpar filtro
            </button>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-[15px] text-[#64748b]">
          Carregando denúncias…
        </div>
      ) : error ? (
        <div className="flex h-40 items-center justify-center rounded-[14px] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] text-[15px] text-[#fca5a5]">
          Erro ao carregar denúncias
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] text-[15px] text-[#64748b]">
          Nenhuma denúncia anônima neste ciclo
          {filterDept ? ' para este setor' : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
