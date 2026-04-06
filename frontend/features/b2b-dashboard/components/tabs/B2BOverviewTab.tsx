// frontend/features/b2b-dashboard/components/tabs/B2BOverviewTab.tsx
'use client'

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

const RISK_ICONS: Record<RiskLevel, string> = {
  low: '🟢',
  moderate: '🟡',
  elevated: '🟠',
  critical: '🔴',
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

  const totalRisk = rd.low + rd.moderate + rd.elevated + rd.critical

  const timeline = overview?.timeline ?? []
  const TIMELINE_COLORS = {
    baixo: '#22c55e',
    moderado: '#eab308',
    elevado: '#f97316',
    critico: '#ef4444',
  }

  const alerts = alertsData?.alerts ?? []

  if (total === 0) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[18px]">📊</span>
            <h2 className="text-[18px] font-bold text-[#e2e8f0]">Visão Geral</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-6 py-16 text-center">
          <span className="text-[40px]">🧠</span>
          <h3 className="mt-4 text-[16px] font-semibold text-[#e2e8f0]">
            Nenhuma avaliação realizada neste ciclo
          </h3>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[#94a3b8]">
            {isPortalMode
              ? `Os painéis serão exibidos quando houver pelo menos ${MIN_EVALUATIONS} avaliações completas neste ciclo.`
              : `Configure os colaboradores em Configurações e convide-os para preencher o formulário. Os painéis são exibidos a partir de ${MIN_EVALUATIONS} avaliações completas.`}
          </p>
          {!isPortalMode && onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="mt-5 rounded-lg bg-[rgba(197,225,85,0.15)] px-5 py-2 text-[13px] font-semibold text-[#c5e155] transition-colors hover:bg-[rgba(197,225,85,0.25)]"
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
          <span className="text-[18px]">📊</span>
          <h2 className="text-[18px] font-bold text-[#e2e8f0]">Visão Geral</h2>
        </div>
      </div>

      {/* Sub-threshold banner */}
      {total > 0 && total < MIN_EVALUATIONS && (
        <div className="rounded-[10px] border border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.06)] px-4 py-3">
          <p className="text-[12px] text-[#eab308]">
            ⚠️ Dados preliminares ({total}/{MIN_EVALUATIONS}) — Os gráficos ficam mais precisos a partir de {MIN_EVALUATIONS} avaliações completas.
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
            <div className="text-[22px]">{k.icon}</div>
            <div
              className="mt-1 font-mono text-[28px] font-bold leading-none tracking-tight"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
            <div className="mt-1 text-[11px] text-[#94a3b8]">{k.label}</div>
            <div className="mt-0.5 text-[10px] text-[#64748b]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Donut chart */}
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-[#e2e8f0]">
            Distribuição de Risco
          </h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200} minWidth={0}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
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
                      fontSize: '12px',
                      color: '#e2e8f0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {pieData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-[12px]"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
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
            <div className="flex h-[200px] flex-col items-center justify-center text-[13px] text-[#64748b]">
              <span className="text-2xl font-bold text-[#e2e8f0]">{total}</span>
              <span className="mt-1">avaliados</span>
              <span className="mt-4">Sem dados de risco</span>
            </div>
          )}
        </div>

        {/* Stacked bar chart — monthly evolution */}
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
          <h3 className="mb-3 text-[13px] font-semibold text-[#e2e8f0]">
            Evolução Mensal (%)
          </h3>
          {timeline.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200} minWidth={0}>
                <BarChart
                  data={timeline}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111b2e',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar
                    dataKey="baixo"
                    name="Baixo"
                    stackId="risk"
                    fill={TIMELINE_COLORS.baixo}
                    barSize={28}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="moderado"
                    name="Moderado"
                    stackId="risk"
                    fill={TIMELINE_COLORS.moderado}
                    barSize={28}
                  />
                  <Bar
                    dataKey="elevado"
                    name="Elevado"
                    stackId="risk"
                    fill={TIMELINE_COLORS.elevado}
                    barSize={28}
                  />
                  <Bar
                    dataKey="critico"
                    name="Crítico"
                    stackId="risk"
                    fill={TIMELINE_COLORS.critico}
                    radius={[3, 3, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-[10px] text-[#64748b]">
                {Object.entries(TIMELINE_COLORS).map(([key, color]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ background: color }}
                    />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[13px] text-[#64748b]">
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
        <h3 className="mb-2.5 text-[13px] font-semibold text-[#ef4444]">
          🚨 Alertas Ativos
        </h3>
        {alerts.length > 0 ? (
          <div className="space-y-1.5">
            {alerts.slice(0, 10).map((alert) => {
              const dotColor = RISK_COLORS[alert.riskLevel as RiskLevel] ?? '#64748b'
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.02)] px-3 py-2"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: dotColor,
                      boxShadow: `0 0 6px ${dotColor}40`,
                    }}
                  />
                  <span className="flex-1 text-[12px] text-[#e2e8f0]">
                    Colaborador anônimo
                    {alert.department ? ` · ${alert.department}` : ''}
                  </span>
                </div>
              )
            })}
            {alerts.length > 10 && (
              <p className="pt-1 text-center text-[11px] text-[#64748b]">
                +{alerts.length - 10} alertas adicionais
              </p>
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-[13px] text-[#64748b]">
            Nenhum alerta neste ciclo
          </p>
        )}
      </div>
    </div>
  )
}
