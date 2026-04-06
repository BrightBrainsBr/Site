// frontend/features/b2b-dashboard/components/tabs/B2BOverviewTab.tsx
'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { B2BOverviewData, RiskLevel } from '../../b2b-dashboard.interface'
import { useB2BAlerts } from '../../hooks/useB2BAlerts'

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  elevated: '#f97316',
  critical: '#ef4444',
}

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Baixo',
  moderate: 'Moderado',
  elevated: 'Elevado',
  critical: 'Crítico',
}

const MIN_EVALUATIONS = 10

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
  const [timelineMode, setTimelineMode] = useState<'percent' | 'count'>(
    'percent'
  )

  const total = overview?.total ?? 0
  const rd = overview?.riskDistribution ?? {
    critical: 0,
    elevated: 0,
    moderate: 0,
    low: 0,
  }

  const kpis: {
    label: string
    value: number | string
    sub: string
    color: string
    icon: string
    borderColor: string
  }[] = [
    {
      label: 'Total Avaliados',
      value: total,
      sub: 'avaliações',
      color: '#c5e155',
      icon: '👥',
      borderColor: 'rgba(197,225,85,0.3)',
    },
    {
      label: 'Risco Baixo',
      value: rd.low,
      sub: total > 0 ? `${Math.round((rd.low / total) * 100)}%` : '0%',
      color: '#22c55e',
      icon: '🟢',
      borderColor: 'rgba(34,197,94,0.3)',
    },
    {
      label: 'Risco Moderado',
      value: rd.moderate,
      sub: total > 0 ? `${Math.round((rd.moderate / total) * 100)}%` : '0%',
      color: '#eab308',
      icon: '🟡',
      borderColor: 'rgba(234,179,8,0.3)',
    },
    {
      label: 'Risco Elevado',
      value: rd.elevated,
      sub: total > 0 ? `${Math.round((rd.elevated / total) * 100)}%` : '0%',
      color: '#f97316',
      icon: '🟠',
      borderColor: 'rgba(249,115,22,0.3)',
    },
    {
      label: 'Risco Crítico',
      value: rd.critical,
      sub: total > 0 ? `${Math.round((rd.critical / total) * 100)}%` : '0%',
      color: '#ef4444',
      icon: '🔴',
      borderColor: 'rgba(239,68,68,0.3)',
    },
  ]

  const pieData = (['low', 'moderate', 'elevated', 'critical'] as RiskLevel[])
    .map((level) => ({
      name: RISK_LABELS[level],
      value: rd[level],
      color: RISK_COLORS[level],
    }))
    .filter((d) => d.value > 0)

  const timeline = overview?.timeline ?? []
  const TIMELINE_COLORS = {
    baixo: '#22c55e',
    moderado: '#eab308',
    elevado: '#f97316',
    critico: '#ef4444',
  }

  const timelineData = useMemo(() => {
    if (timelineMode === 'count') return timeline
    return timeline.map((m) => {
      const sum = m.baixo + m.moderado + m.elevado + m.critico
      if (sum === 0) return { ...m, baixo: 0, moderado: 0, elevado: 0, critico: 0 }
      return {
        month: m.month,
        baixo: Math.round((m.baixo / sum) * 100),
        moderado: Math.round((m.moderado / sum) * 100),
        elevado: Math.round((m.elevado / sum) * 100),
        critico: Math.round((m.critico / sum) * 100),
      }
    })
  }, [timeline, timelineMode])

  const alerts = alertsData?.alerts ?? []

  const aggregateAlerts = useMemo(() => {
    const items: { text: string; level: RiskLevel }[] = []

    if (rd.critical > 0) {
      items.push({
        text: `${rd.critical} colaborador${rd.critical > 1 ? 'es' : ''} em risco crítico — ação imediata requerida`,
        level: 'critical',
      })
    }

    if (rd.elevated > 0) {
      items.push({
        text: `${rd.elevated} colaborador${rd.elevated > 1 ? 'es' : ''} em risco elevado — acompanhamento recomendado`,
        level: 'elevated',
      })
    }

    const deptCounts: Record<string, { critical: number; elevated: number }> = {}
    for (const a of alerts) {
      const dept = a.department ?? 'Sem departamento'
      if (!deptCounts[dept]) deptCounts[dept] = { critical: 0, elevated: 0 }
      if (a.riskLevel === 'critical') deptCounts[dept].critical++
      if (a.riskLevel === 'elevated') deptCounts[dept].elevated++
    }

    const worstDept = Object.entries(deptCounts)
      .filter(([, c]) => c.critical + c.elevated > 0)
      .sort(([, a], [, b]) => b.critical + b.elevated - (a.critical + a.elevated))[0]

    if (worstDept) {
      const [dept, counts] = worstDept
      const highRisk = counts.critical + counts.elevated
      items.push({
        text: `Setor ${dept} com ${highRisk} colaborador${highRisk > 1 ? 'es' : ''} em risco elevado/crítico — maior concentração da empresa`,
        level: 'elevated',
      })
    }

    const srq20Count = alerts.filter(
      (a) => a.reasons?.includes('srq20_elevado')
    ).length
    if (srq20Count > 0) {
      items.push({
        text: `${srq20Count} colaborador${srq20Count > 1 ? 'es' : ''} com SRQ-20 ≥ 8 — rastreamento positivo para transtornos mentais comuns`,
        level: 'moderate',
      })
    }

    const aepCount = alerts.filter(
      (a) => a.reasons?.includes('aep_elevado')
    ).length
    if (aepCount > 0) {
      items.push({
        text: `${aepCount} colaborador${aepCount > 1 ? 'es' : ''} com AEP elevado (≥ 29/56) — fatores ergonômicos requerem atenção`,
        level: 'moderate',
      })
    }

    return items
  }, [rd, alerts])

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
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-[14px] border bg-[rgba(255,255,255,0.03)] p-4 text-center"
            style={{ borderColor: k.borderColor }}
          >
            <div className="text-[24px]">{k.icon}</div>
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
        {/* Donut chart */}
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
          <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
            Distribuição de Risco
          </h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={1}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111b2e',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#e2e8f0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2">
                {pieData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-2 text-[15px]"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-[#94a3b8]">{d.name}</span>
                    <span className="ml-auto font-semibold text-[#e2e8f0]">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center text-[14px] text-[#64748b]">
              <span className="text-2xl font-bold text-[#e2e8f0]">{total}</span>
              <span className="mt-1">avaliados</span>
              <span className="mt-4">Sem dados de risco</span>
            </div>
          )}
        </div>

        {/* Stacked bar chart — monthly evolution */}
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[17px] font-semibold text-[#e2e8f0]">
              Evolução Mensal{' '}
              {timelineMode === 'percent' ? '(%)' : '(contagem)'}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setTimelineMode('percent')}
                className={`rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
                  timelineMode === 'percent'
                    ? 'bg-[rgba(197,225,85,0.15)] text-[#c5e155]'
                    : 'text-[#64748b] hover:text-[#94a3b8]'
                }`}
              >
                %
              </button>
              <button
                onClick={() => setTimelineMode('count')}
                className={`rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
                  timelineMode === 'count'
                    ? 'bg-[rgba(197,225,85,0.15)] text-[#c5e155]'
                    : 'text-[#64748b] hover:text-[#94a3b8]'
                }`}
              >
                #
              </button>
            </div>
          </div>
          {timelineData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart
                  data={timelineData}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
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
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    domain={timelineMode === 'percent' ? [0, 100] : undefined}
                    tickFormatter={
                      timelineMode === 'percent'
                        ? (v: number) => `${v}%`
                        : undefined
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111b2e',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value) =>
                      timelineMode === 'percent' ? `${value}%` : `${value}`
                    }
                  />
                  <Bar
                    dataKey="baixo"
                    name="Baixo"
                    stackId="risk"
                    fill={TIMELINE_COLORS.baixo}
                    barSize={36}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="moderado"
                    name="Moderado"
                    stackId="risk"
                    fill={TIMELINE_COLORS.moderado}
                    barSize={36}
                  />
                  <Bar
                    dataKey="elevado"
                    name="Elevado"
                    stackId="risk"
                    fill={TIMELINE_COLORS.elevado}
                    barSize={36}
                  />
                  <Bar
                    dataKey="critico"
                    name="Crítico"
                    stackId="risk"
                    fill={TIMELINE_COLORS.critico}
                    radius={[3, 3, 0, 0]}
                    barSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-[14px] text-[#64748b]">
                {Object.entries(TIMELINE_COLORS).map(([key, color]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: color }}
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-[14px] text-[#64748b]">
              Dados de evolução disponíveis após o segundo ciclo
            </div>
          )}
        </div>
      </div>

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
        {aggregateAlerts.length > 0 ? (
          <div className="space-y-2">
            {aggregateAlerts.map((alert, i) => {
              const dotColor =
                RISK_COLORS[alert.level] ?? '#64748b'
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
                    {alert.text}
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
