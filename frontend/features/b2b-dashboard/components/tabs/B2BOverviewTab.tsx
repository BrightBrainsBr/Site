// frontend/features/b2b-dashboard/components/tabs/B2BOverviewTab.tsx
'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

import type {
  B2BAlertData,
  B2BOverviewData,
  NR1RiskBand,
} from '../../b2b-dashboard.interface'
import { useB2BAlerts } from '../../hooks/useB2BAlerts'

const NR1_BAND_COLORS: Record<NR1RiskBand, string> = {
  baixo: '#22c55e',
  moderado: '#eab308',
  alto: '#f97316',
  critico: '#ef4444',
}

const NR1_BAND_LABELS: Record<NR1RiskBand, string> = {
  baixo: 'Baixo',
  moderado: 'Moderado',
  alto: 'Alto',
  critico: 'Crítico',
}

const MIN_EVALUATIONS = 10

function scoreToColor(score: number | null): string {
  if (score == null) return '#64748b'
  if (score < 2) return '#22c55e'
  if (score < 3) return '#eab308'
  if (score < 4) return '#f97316'
  return '#ef4444'
}

function scoreToBand(score: number | null): NR1RiskBand | null {
  if (score == null) return null
  if (score < 2) return 'baixo'
  if (score < 3) return 'moderado'
  if (score < 4) return 'alto'
  return 'critico'
}

const PSYCHO_LABELS: Record<string, string> = {
  workload: 'Carga de Trabalho',
  pace: 'Ritmo',
  autonomy: 'Autonomia',
  leadership: 'Liderança',
  relationships: 'Relações',
  recognition: 'Reconhecimento',
  clarity: 'Clareza',
  balance: 'Equilíbrio',
}

const DOMAIN_LABELS: Array<{
  key: keyof Pick<B2BOverviewData, 'scorePhysical' | 'scoreErgonomic' | 'scorePsychosocial' | 'scoreViolence'>
  label: string
}> = [
  { key: 'scorePhysical', label: 'Físico' },
  { key: 'scoreErgonomic', label: 'Ergonômico' },
  { key: 'scorePsychosocial', label: 'Psicossocial' },
  { key: 'scoreViolence', label: 'Violência' },
]

const SEVERITY_LABELS: Record<string, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  moderado: 'Moderado',
}

interface B2BOverviewTabProps {
  companyId: string | null
  cycleId: string | null
  overview: B2BOverviewData | undefined
  isPortalMode?: boolean
  onNavigateToSettings?: () => void
}

export function B2BOverviewTab({
  companyId,
  cycleId,
  overview,
  isPortalMode = false,
  onNavigateToSettings,
}: B2BOverviewTabProps) {
  const { data: alertsData } = useB2BAlerts(companyId, cycleId)

  const total = overview?.total ?? 0
  const scoreOverall = overview?.scoreOverall ?? null
  const overallBand = scoreToBand(scoreOverall)

  const kpis = [
    {
      label: 'Avaliações',
      value: total,
      sub: 'no ciclo',
      color: '#c5e155',
      borderColor: 'rgba(197,225,85,0.3)',
    },
    {
      label: 'Score Médio',
      value: scoreOverall != null ? scoreOverall.toFixed(1) : '–',
      sub: overallBand ? NR1_BAND_LABELS[overallBand] : '–',
      color: scoreToColor(scoreOverall),
      borderColor: `${scoreToColor(scoreOverall)}50`,
    },
    {
      label: 'Ações Pendentes',
      value: overview?.pendingActions ?? 0,
      sub: 'em aberto',
      color: '#eab308',
      borderColor: 'rgba(234,179,8,0.3)',
    },
    {
      label: 'Incidentes',
      value: overview?.incidentsThisCycle ?? 0,
      sub: 'neste ciclo',
      color: '#ef4444',
      borderColor: 'rgba(239,68,68,0.3)',
    },
  ]

  const domainBarData = useMemo(() => {
    if (!overview) return []
    return DOMAIN_LABELS.map(({ key, label }) => {
      const score = overview[key]
      return {
        name: label,
        score: score ?? 0,
        color: scoreToColor(score),
      }
    })
  }, [overview])

  const radarData = useMemo(() => {
    if (!overview?.psychosocialAxes) return []
    return Object.entries(PSYCHO_LABELS).map(([key, label]) => {
      const val =
        overview.psychosocialAxes[key as keyof typeof overview.psychosocialAxes]
      return {
        axis: label,
        value: typeof val === 'number' ? val : 0,
      }
    })
  }, [overview?.psychosocialAxes])

  const timeline = overview?.timeline ?? []
  const alerts = alertsData?.alerts ?? []

  if (total === 0) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[20px]">📊</span>
            <h2 className="text-[20px] font-bold text-[#e2e8f0]">
              Visão Geral
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-6 py-16 text-center">
          <span className="text-[40px]">🧠</span>
          <h3 className="mt-4 text-[18px] font-semibold text-[#e2e8f0]">
            Nenhuma avaliação realizada neste ciclo
          </h3>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#94a3b8]">
            {isPortalMode
              ? `Os painéis serão exibidos quando houver pelo menos ${MIN_EVALUATIONS} avaliações completas neste ciclo.`
              : `Configure os colaboradores em Configurações e convide-os para preencher o formulário. Os painéis são exibidos a partir de ${MIN_EVALUATIONS} avaliações completas.`}
          </p>
          {!isPortalMode && onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="mt-5 rounded-lg bg-[rgba(197,225,85,0.15)] px-5 py-2 text-[14px] font-semibold text-[#c5e155] transition-colors hover:bg-[rgba(197,225,85,0.25)]"
            >
              → Ir para Configurações
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">📊</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">Visão Geral</h2>
        </div>
      </div>

      {/* Sub-threshold banner */}
      {total > 0 && total < MIN_EVALUATIONS && (
        <div className="rounded-[10px] border border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.06)] px-4 py-3">
          <p className="text-[15px] text-[#eab308]">
            ⚠️ Dados preliminares ({total}/{MIN_EVALUATIONS}) — Os gráficos
            ficam mais precisos a partir de {MIN_EVALUATIONS} avaliações
            completas.
          </p>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-[14px] border bg-[rgba(255,255,255,0.03)] p-4 text-center"
            style={{ borderColor: k.borderColor }}
          >
            <div
              className="mt-1 font-mono text-[32px] font-bold leading-none tracking-tight"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
            <div className="mt-1.5 text-[15px] text-[#94a3b8]">{k.label}</div>
            <div className="mt-0.5 text-[14px] text-[#64748b]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Psychosocial Radar */}
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
          <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
            Eixos Psicossociais (8 dimensões)
          </h3>
          {radarData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <PolarRadiusAxis
                  domain={[0, 5]}
                  tickCount={6}
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={false}
                />
                <Radar
                  name="Empresa"
                  dataKey="value"
                  stroke="#c5e155"
                  fill="rgba(197,225,85,0.15)"
                  strokeWidth={2}
                  dot={{ fill: '#c5e155', r: 4 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111b2e',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value) => [Number(value).toFixed(1), 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-[14px] text-[#64748b]">
              Sem dados psicossociais
            </div>
          )}
        </div>

        {/* Domain bar chart */}
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
          <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
            Score por Domínio NR-1
          </h3>
          {domainBarData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={domainBarData}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111b2e',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => [
                      Number(value).toFixed(2),
                      'Score',
                    ]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={48}>
                    {domainBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-[14px] text-[#64748b]">
                {Object.entries(NR1_BAND_COLORS).map(([key, color]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: color }}
                    />
                    {NR1_BAND_LABELS[key as NR1RiskBand]}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-[14px] text-[#64748b]">
              Sem dados de domínio
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 1 && (
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
          <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
            Evolução Mensal — Score Geral
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={timeline}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111b2e',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value) => [
                  value != null ? Number(value).toFixed(2) : '–',
                  'Score',
                ]}
              />
              <Line
                type="monotone"
                dataKey="scoreOverall"
                stroke="#c5e155"
                strokeWidth={2}
                dot={{ fill: '#c5e155', r: 4, stroke: '#c5e155' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alerts section */}
      <div
        className="rounded-[14px] border p-5"
        style={{
          borderColor: 'rgba(239,68,68,0.2)',
          background: 'rgba(239,68,68,0.04)',
        }}
      >
        <h3 className="mb-3 text-[17px] font-semibold text-[#ef4444]">
          🚨 Alertas Ativos
        </h3>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert: B2BAlertData, i: number) => {
              const dotColor =
                NR1_BAND_COLORS[alert.severity as NR1RiskBand] ?? '#64748b'
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.02)] px-4 py-2.5"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: dotColor,
                      boxShadow: `0 0 6px ${dotColor}40`,
                    }}
                  />
                  <span className="flex-1 text-[15px] text-[#e2e8f0]">
                    {alert.message}
                  </span>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold"
                    style={{
                      backgroundColor: `${dotColor}20`,
                      color: dotColor,
                    }}
                  >
                    {SEVERITY_LABELS[alert.severity] ?? alert.severity}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-[14px] text-[#64748b]">
            Nenhum alerta neste ciclo
          </p>
        )}
      </div>
    </div>
  )
}
