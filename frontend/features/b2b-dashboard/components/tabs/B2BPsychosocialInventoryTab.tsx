// frontend/features/b2b-dashboard/components/tabs/B2BPsychosocialInventoryTab.tsx
'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { CopsoqClassification } from '~/app/api/brightmonitor/lib/riskUtils'

import type { PsychosocialRisk } from '../../hooks/useB2BPsychosocialInventoryQueryHook'
import { useB2BPsychosocialInventoryQueryHook } from '../../hooks/useB2BPsychosocialInventoryQueryHook'

interface Props {
  companyId: string | null
  cycleId: string | null
}

const CLASSIFICATION_CONFIG: Record<
  CopsoqClassification,
  { label: string; color: string; bg: string }
> = {
  baixo: { label: 'Baixo', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  medio: { label: 'Médio', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  alto: { label: 'Alto', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const SEM_DADOS_COLOR = '#475569'

type SortKey = 'classification' | 'score' | 'name'

function classificationRank(
  c: CopsoqClassification | null | undefined
): number {
  if (c === 'alto') return 3
  if (c === 'medio') return 2
  if (c === 'baixo') return 1
  return 0
}

function ClassificationBadge({
  classification,
}: {
  classification: CopsoqClassification | null
}) {
  if (!classification) {
    return (
      <span
        className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
        style={{
          color: SEM_DADOS_COLOR,
          backgroundColor: 'rgba(71,85,105,0.15)',
        }}
      >
        Sem dados
      </span>
    )
  }
  const cfg = CLASSIFICATION_CONFIG[classification]
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}

function RiskRow({ risk }: { risk: PsychosocialRisk }) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[#e2e8f0]">
          {risk.name}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-[#64748b]">
          {risk.description}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[11px] uppercase tracking-wider text-[#475569]">
          Probabilidade
        </p>
        <p className="text-[13px] font-mono text-[#cbd5e1]">
          {risk.probability != null
            ? `${(risk.probability * 100).toFixed(0)}%`
            : '—'}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[11px] uppercase tracking-wider text-[#475569]">
          Severidade
        </p>
        <p className="text-[13px] font-mono text-[#cbd5e1]">
          {risk.severity != null ? risk.severity.toFixed(1) : '—'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[11px] uppercase tracking-wider text-[#475569]">
          Respostas
        </p>
        <p className="text-[13px] font-mono text-[#cbd5e1]">{risk.responses}</p>
      </div>
      <ClassificationBadge classification={risk.classification} />
    </div>
  )
}

export function B2BPsychosocialInventoryTab({ companyId, cycleId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('classification')

  const { data, isLoading, isError } = useB2BPsychosocialInventoryQueryHook(
    companyId,
    cycleId
  )

  const risks = data?.risks ?? []
  const byClassification = data?.byClassification ?? {
    baixo: 0,
    medio: 0,
    alto: 0,
    sem_dados: 0,
  }
  const byDepartment = data?.byDepartment ?? []

  const sortedRisks = useMemo(() => {
    const arr = [...risks]
    if (sortKey === 'classification') {
      arr.sort(
        (a, b) =>
          classificationRank(b.classification) -
            classificationRank(a.classification) ||
          (b.score ?? 0) - (a.score ?? 0)
      )
    } else if (sortKey === 'score') {
      arr.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    }
    return arr
  }, [risks, sortKey])

  const pieData = useMemo(
    () =>
      [
        {
          name: 'Baixo',
          value: byClassification.baixo,
          color: CLASSIFICATION_CONFIG.baixo.color,
        },
        {
          name: 'Médio',
          value: byClassification.medio,
          color: CLASSIFICATION_CONFIG.medio.color,
        },
        {
          name: 'Alto',
          value: byClassification.alto,
          color: CLASSIFICATION_CONFIG.alto.color,
        },
        {
          name: 'Sem dados',
          value: byClassification.sem_dados,
          color: SEM_DADOS_COLOR,
        },
      ].filter((d) => d.value > 0),
    [byClassification]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[15px] text-[#64748b]">
        Carregando inventário psicossocial…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-[15px] text-[#F87171]">
        Erro ao carregar inventário
      </div>
    )
  }

  const totalEvaluations = data?.totalEvaluations ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">📋</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            Inventário de Riscos Psicossociais
          </h2>
          <span className="rounded-full bg-[rgba(124,106,247,0.15)] px-2 py-0.5 text-[12px] font-semibold text-[#a99df7]">
            COPSOQ II
          </span>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Lista pré-definida de riscos psicossociais classificados por
          probabilidade e severidade — {totalEvaluations} avaliações no ciclo.
        </p>
      </div>

      {totalEvaluations === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425]">
          <span className="text-[28px]">📭</span>
          <p className="text-[15px] font-semibold text-[#e2e8f0]">
            Nenhuma avaliação neste ciclo
          </p>
          <p className="text-[13px] text-[#64748b]">
            O inventário será gerado conforme os colaboradores responderem o
            questionário NR-1.
          </p>
        </div>
      ) : (
        <>
          {/* Pie chart + summary */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-5 lg:col-span-2">
              <h3 className="mb-3 text-[15px] font-semibold text-[#e2e8f0]">
                Distribuição dos Riscos
              </h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      label={(entry: { name?: string; value?: number }) =>
                        `${entry.name}: ${entry.value}`
                      }
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b2e',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2">
              {(
                Object.entries(CLASSIFICATION_CONFIG) as [
                  CopsoqClassification,
                  (typeof CLASSIFICATION_CONFIG)[CopsoqClassification],
                ][]
              ).map(([key, cfg]) => (
                <div
                  key={key}
                  className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-4"
                >
                  <p className="text-[13px] text-[#94a3b8]">{cfg.label}</p>
                  <p
                    className="mt-1 text-[28px] font-bold"
                    style={{ color: cfg.color }}
                  >
                    {byClassification[key]}
                  </p>
                  <p className="text-[12px] text-[#64748b]">
                    de {risks.length} riscos
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk list */}
          <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#e2e8f0]">
                Lista de Riscos
              </h3>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0c1425] px-2.5 py-1 text-[12px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              >
                <option value="classification">
                  Ordenar por classificação
                </option>
                <option value="score">Ordenar por pontuação</option>
                <option value="name">Ordenar por nome</option>
              </select>
            </div>
            <div className="space-y-2">
              {sortedRisks.map((risk) => (
                <RiskRow key={risk.id} risk={risk} />
              ))}
            </div>
          </div>

          {/* By-department chart */}
          {byDepartment.length > 0 && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
              <h3 className="mb-3 text-[15px] font-semibold text-[#e2e8f0]">
                Riscos por Setor
              </h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byDepartment}
                    layout="vertical"
                    margin={{ left: 80, right: 24, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="department"
                      stroke="#64748b"
                      tick={{ fill: '#cbd5e1', fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b2e',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      iconType="circle"
                      wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }}
                    />
                    <Bar
                      dataKey="baixo"
                      stackId="risks"
                      name="Baixo"
                      fill={CLASSIFICATION_CONFIG.baixo.color}
                    />
                    <Bar
                      dataKey="medio"
                      stackId="risks"
                      name="Médio"
                      fill={CLASSIFICATION_CONFIG.medio.color}
                    />
                    <Bar
                      dataKey="alto"
                      stackId="risks"
                      name="Alto"
                      fill={CLASSIFICATION_CONFIG.alto.color}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
