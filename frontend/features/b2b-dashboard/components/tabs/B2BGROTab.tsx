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

// Fixed distinct colors per AEP dimension for visual clarity
const AEP_DIM_COLORS: Record<string, string> = {
  pressure: '#f97316',
  autonomy: '#eab308',
  breaks: '#60a5fa',
  relationships: '#22c55e',
  cognitive: '#a78bfa',
  environment: '#14b8a6',
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

// ─── Custom tooltip for AEP horizontal bars ───────────────
function AepTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; payload: { max: number; color: string } }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  const max = payload[0]?.payload?.max ?? 12
  const color = payload[0]?.payload?.color ?? '#e2e8f0'
  return (
    <div
      style={{
        backgroundColor: '#0c1425',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '13px',
      }}
    >
      <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#94a3b8', margin: 0 }}>
        Score:{' '}
        <span style={{ color, fontWeight: 700 }}>{val.toFixed(1)}</span>
        <span style={{ color: '#64748b' }}> / {max}</span>
      </p>
    </div>
  )
}

// ─── Custom tooltip for Radar chart ───────────────────────
function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: { scale: string; value: number; pct: number } }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  return (
    <div
      style={{
        backgroundColor: '#0c1425',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '13px',
      }}
    >
      <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{item.scale}</p>
      <p style={{ color: '#94a3b8', margin: 0 }}>
        Média:{' '}
        <span style={{ color: '#c5e155', fontWeight: 700 }}>{item.value.toFixed(1)}</span>
        <span style={{ color: '#64748b' }}> ({item.pct}% do máx.)</span>
      </p>
    </div>
  )
}

interface B2BGROTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BGROTab({ companyId, cycleId }: B2BGROTabProps) {
  const { data: gro, isLoading } = useB2BGROQueryHook(companyId, {
    cycle: cycleId ?? undefined,
  })

  // Always include all 6 scales; normalize each to % of clinical max
  // so the radar polygon is properly sized even when scales have very different ranges
  const radarData = useMemo(() => {
    return Object.entries(SCALE_DISPLAY).map(([key, cfg]) => {
      const rawValue = gro?.scaleAverages?.[key] ?? 0
      const pct = Math.round((rawValue / cfg.max) * 100)
      return { scale: cfg.label, value: rawValue, pct, max: cfg.max }
    })
  }, [gro?.scaleAverages])

  const aepData = useMemo(() => {
    if (!gro?.aepDimensions) return []
    return Object.entries(AEP_DIM_LABELS).map(([key, label]) => ({
      dimension: label,
      value: gro.aepDimensions[key] ?? 0,
      max: AEP_DIM_MAX[key] ?? 12,
      color: AEP_DIM_COLORS[key] ?? '#94a3b8',
    }))
  }, [gro?.aepDimensions])

  const matrix = gro?.riskMatrix ?? []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[14px] text-[#64748b]">
        Carregando dados GRO…
      </div>
    )
  }

  const hasScaleData = radarData.some((d) => d.value > 0)
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
          <span className="text-[20px]">⚖️</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">GRO Psicossocial</h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Gerenciamento de Riscos Ocupacionais — Fatores Psicossociais e Ergonomia Cognitiva
        </p>
      </div>

      {noData ? (
        <div className="flex flex-col items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-6 py-16 text-center">
          <span className="text-[32px]">⚖️</span>
          <h3 className="mt-3 text-[18px] font-semibold text-[#e2e8f0]">
            Nenhum dado GRO disponível
          </h3>
          <p className="mt-2 max-w-md text-[14px] text-[#94a3b8]">
            Os indicadores de GRO Psicossocial são gerados automaticamente a partir das
            avaliações dos colaboradores. Mínimo de 10 avaliações recomendado.
          </p>
        </div>
      ) : (
        <>
          {/* Row 1: Radar + AEP Dimensions */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Radar chart — normalized 0-100% per clinical max */}
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
                Escalas Clínicas — Média Geral
              </h3>
              {hasScaleData ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis
                      dataKey="scale"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tickCount={4}
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      tickFormatter={(v: number) => `${v}%`}
                      axisLine={false}
                    />
                    <Radar
                      name="Empresa"
                      dataKey="pct"
                      stroke="#c5e155"
                      fill="rgba(197,225,85,0.15)"
                      strokeWidth={2}
                      dot={{ fill: '#c5e155', r: 4 }}
                    />
                    <Tooltip content={<RadarTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-[15px] text-[#64748b]">
                  Sem dados de escalas clínicas
                </div>
              )}
            </div>

            {/* AEP Dimensions — horizontal bars, distinct color per dimension */}
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
                AEP — Dimensões (Média Empresa)
              </h3>
              {hasAepData ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={aepData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      domain={[0, 12]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="dimension"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<AepTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={26}>
                      {aepData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-[15px] text-[#64748b]">
                  Sem dados AEP
                </div>
              )}
            </div>
          </div>

          {/* SRQ-20 Distribution */}
          {hasSrqData && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
                SRQ-20 (OMS) — Distribuição de Rastreamento
              </h3>
              <div className="mb-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {SRQ_RANGES.map((r) => (
                  <div
                    key={r.key}
                    className="rounded-[10px] p-3 text-center"
                    style={{ background: `${r.color}08`, border: `1px solid ${r.color}20` }}
                  >
                    <div
                      className="font-mono text-[26px] font-bold leading-none tracking-tight"
                      style={{ color: r.color }}
                    >
                      {gro?.srq20Distribution[r.key] ?? 0}
                    </div>
                    <div className="mt-1.5 text-[14px] text-[#94a3b8]">
                      SRQ {r.range} ({r.label})
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-[rgba(255,255,255,0.02)] px-3 py-2 text-[14px] text-[#64748b]">
                📎 O SRQ-20 da OMS é o instrumento recomendado pelo Ministério da Saúde para
                vigilância de transtornos mentais comuns em ambiente ocupacional. Ponto de corte:
                ≥ 8 (Mari & Williams, 1986).
              </div>
            </div>
          )}

          {/* Probability × Severity Matrix */}
          {hasMatrix && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
                Matriz Probabilidade × Severidade — Consolidado
              </h3>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: '90px repeat(4, 1fr)' }}>
                <div />
                {['Sev. Baixa', 'Sev. Moderada', 'Sev. Alta', 'Sev. Muito Alta'].map((h) => (
                  <div
                    key={h}
                    className="rounded p-2 text-center text-[13px] font-semibold text-[#94a3b8]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {h}
                  </div>
                ))}

                {['Prob. Alta', 'Prob. Média', 'Prob. Baixa'].map((rowLabel, rowIdx) => (
                  <div key={rowIdx} className="contents">
                    <div
                      className="flex items-center text-[13px] font-semibold text-[#94a3b8]"
                      style={{ padding: '8px' }}
                    >
                      {rowLabel}
                    </div>
                    {[0, 1, 2, 3].map((colIdx) => {
                      const value = matrix[rowIdx]?.[colIdx] ?? 0
                      const color = MATRIX_COLORS[rowIdx]?.[colIdx] ?? '#64748b'
                      return (
                        <div
                          key={`cell-${rowIdx}-${colIdx}`}
                          className="rounded p-2.5 text-center font-mono text-[17px] font-bold"
                          style={{ background: `${color}20`, color }}
                        >
                          {value}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center text-[13px] text-[#64748b]">
                Número de colaboradores por célula da matriz · Ref. NR-1: 1.5.4.4.2
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
