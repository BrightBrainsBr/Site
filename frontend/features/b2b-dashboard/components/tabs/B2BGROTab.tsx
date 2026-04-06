// frontend/features/b2b-dashboard/components/tabs/B2BGROTab.tsx
'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useB2BGROQueryHook } from '../../hooks/useB2BGROQueryHook'

const AEP_DIM_LABELS: Record<string, string> = {
  pressure: 'Pressão Metas',
  autonomy: 'Autonomia',
  breaks: 'Pausas',
  relationships: 'Relações',
  cognitive: 'Demandas Cogn.',
  environment: 'Ambiente',
}

const AEP_DIM_MAX: Record<string, number> = {
  pressure: 12,
  autonomy: 8,
  breaks: 8,
  relationships: 12,
  cognitive: 8,
  environment: 8,
}

function getAepBarColor(value: number, max: number): string {
  const pct = value / max
  if (pct < 0.4) return '#22c55e'
  if (pct < 0.6) return '#eab308'
  return '#f97316'
}

const SCALE_DISPLAY: Record<string, { label: string; max: number }> = {
  phq9: { label: 'PHQ-9', max: 27 },
  gad7: { label: 'GAD-7', max: 21 },
  srq20: { label: 'SRQ-20', max: 20 },
  pss10: { label: 'PSS-10', max: 40 },
  mbi: { label: 'MBI-EE', max: 80 },
  isi: { label: 'ISI', max: 28 },
}

const SRQ_RANGES = [
  { label: 'Negativo', range: '< 8', color: '#22c55e', key: 'negative' as const },
  { label: 'Moderado', range: '8-11', color: '#eab308', key: 'moderate' as const },
  { label: 'Elevado', range: '12-16', color: '#f97316', key: 'elevated' as const },
  { label: 'Crítico', range: '17-20', color: '#ef4444', key: 'critical' as const },
]

const MATRIX_COLORS = [
  ['#22c55e', '#22c55e', '#eab308', '#f97316'],
  ['#22c55e', '#eab308', '#f97316', '#ef4444'],
  ['#eab308', '#f97316', '#ef4444', '#ef4444'],
]

interface B2BGROTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BGROTab({ companyId, cycleId }: B2BGROTabProps) {
  const { data: gro, isLoading } = useB2BGROQueryHook(companyId, {
    cycle: cycleId ?? undefined,
  })

  const radarData = useMemo(() => {
    if (!gro?.scaleAverages) return []
    return Object.entries(SCALE_DISPLAY)
      .filter(([key]) => (gro.scaleAverages[key] ?? 0) > 0)
      .map(([key, cfg]) => ({
        scale: cfg.label,
        value: gro.scaleAverages[key] ?? 0,
        max: cfg.max,
      }))
  }, [gro?.scaleAverages])

  const aepData = useMemo(() => {
    if (!gro?.aepDimensions) return []
    return Object.entries(AEP_DIM_LABELS).map(([key, label]) => ({
      dimension: label,
      value: gro.aepDimensions[key] ?? 0,
      max: AEP_DIM_MAX[key] ?? 12,
      fill: getAepBarColor(
        gro.aepDimensions[key] ?? 0,
        AEP_DIM_MAX[key] ?? 12
      ),
    }))
  }, [gro?.aepDimensions])

  const matrix = gro?.riskMatrix ?? []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-[#64748b]">
        Carregando dados GRO…
      </div>
    )
  }

  const hasScaleData = radarData.length > 0
  const hasAepData = aepData.some((d) => d.value > 0)
  const hasSrqData =
    gro?.srq20Distribution &&
    (gro.srq20Distribution.negative > 0 ||
      gro.srq20Distribution.moderate > 0 ||
      gro.srq20Distribution.elevated > 0 ||
      gro.srq20Distribution.critical > 0)
  const hasMatrix = matrix.length > 0

  const noData = !hasScaleData && !hasAepData && !hasSrqData && !hasMatrix

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[18px]">⚖️</span>
          <h2 className="text-[18px] font-bold text-[#e2e8f0]">
            GRO Psicossocial
          </h2>
        </div>
        <p className="mt-0.5 pl-[26px] text-[12px] text-[#64748b]">
          Gerenciamento de Riscos Ocupacionais — Fatores Psicossociais e
          Ergonomia Cognitiva
        </p>
      </div>

      {noData ? (
        <div className="flex h-48 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[13px] text-[#64748b]">
          Nenhum dado GRO disponível — execute avaliações para gerar os
          indicadores.
        </div>
      ) : (
        <>
          {/* Row 1: Radar + AEP Dimensions */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Radar chart */}
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-[#e2e8f0]">
                Escalas Clínicas — Média Geral
              </h3>
              {hasScaleData ? (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart
                    data={radarData}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                  >
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis
                      dataKey="scale"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <PolarRadiusAxis
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      axisLine={false}
                    />
                    <Radar
                      name="Empresa"
                      dataKey="value"
                      stroke="#c5e155"
                      fill="rgba(197,225,85,0.15)"
                      strokeWidth={2}
                      dot={{ fill: '#c5e155', r: 3 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b2e',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#e2e8f0',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-[12px] text-[#64748b]">
                  Sem dados de escalas clínicas
                </div>
              )}
            </div>

            {/* AEP Dimensions — horizontal bars */}
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-[#e2e8f0]">
                AEP — Dimensões (Média Empresa)
              </h3>
              {hasAepData ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={aepData}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      domain={[0, 12]}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="dimension"
                      type="category"
                      width={110}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b2e',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                      {aepData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-[12px] text-[#64748b]">
                  Sem dados AEP
                </div>
              )}
            </div>
          </div>

          {/* SRQ-20 Distribution */}
          {hasSrqData && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-[#e2e8f0]">
                SRQ-20 (OMS) — Distribuição de Rastreamento
              </h3>
              <div className="mb-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {SRQ_RANGES.map((r) => (
                  <div
                    key={r.key}
                    className="rounded-[10px] p-3 text-center"
                    style={{
                      background: `${r.color}08`,
                      border: `1px solid ${r.color}15`,
                    }}
                  >
                    <div
                      className="font-mono text-[22px] font-bold leading-none tracking-tight"
                      style={{ color: r.color }}
                    >
                      {gro?.srq20Distribution[r.key] ?? 0}
                    </div>
                    <div className="mt-1 text-[10px] text-[#94a3b8]">
                      SRQ {r.range} ({r.label})
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-[rgba(255,255,255,0.02)] px-3 py-2 text-[11px] text-[#64748b]">
                📎 O SRQ-20 da OMS é o instrumento recomendado pelo Ministério
                da Saúde para vigilância de transtornos mentais comuns em
                ambiente ocupacional. Ponto de corte: ≥ 8 (Mari & Williams,
                1986).
              </div>
            </div>
          )}

          {/* Probability × Severity Matrix */}
          {hasMatrix && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-[#e2e8f0]">
                Matriz Probabilidade × Severidade — Consolidado
              </h3>
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: '80px repeat(4, 1fr)' }}
              >
                {/* Headers */}
                <div />
                {[
                  'Sev. Baixa',
                  'Sev. Moderada',
                  'Sev. Alta',
                  'Sev. Muito Alta',
                ].map((h) => (
                  <div
                    key={h}
                    className="rounded p-2 text-center text-[10px] font-semibold text-[#94a3b8]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {h}
                  </div>
                ))}

                {/* Rows: Prob. Alta (2), Prob. Média (1), Prob. Baixa (0) */}
                {['Prob. Alta', 'Prob. Média', 'Prob. Baixa'].map(
                  (rowLabel, rowIdx) => (
                    <div key={rowIdx} className="contents">
                      <div
                        className="flex items-center text-[10px] font-semibold text-[#94a3b8]"
                        style={{ padding: '8px' }}
                      >
                        {rowLabel}
                      </div>
                      {[0, 1, 2, 3].map((colIdx) => {
                        const value =
                          matrix[rowIdx]?.[colIdx] ?? 0
                        const color = MATRIX_COLORS[rowIdx]?.[colIdx] ?? '#64748b'
                        return (
                          <div
                            key={`cell-${rowIdx}-${colIdx}`}
                            className="rounded p-2.5 text-center font-mono text-[14px] font-bold"
                            style={{
                              background: `${color}20`,
                              color,
                            }}
                          >
                            {value}
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
              <div className="mt-2 text-center text-[10px] text-[#64748b]">
                Número de colaboradores por célula da matriz · Ref. NR-1:
                1.5.4.4.2
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
