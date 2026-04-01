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
  low: '#10B981',
  moderate: '#F59E0B',
  elevated: '#F97316',
  critical: '#EF4444',
}

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Baixo',
  moderate: 'Moderado',
  elevated: 'Elevado',
  critical: 'Crítico',
}

const URGENCY_BADGE: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)', text: '#F87171' },
  elevated: { bg: 'rgba(249,115,22,0.15)', text: '#FB923C' },
  moderate: { bg: 'rgba(245,158,11,0.15)', text: '#FBBF24' },
  low: { bg: 'rgba(16,185,129,0.15)', text: '#34D399' },
}

interface B2BOverviewTabProps {
  companyId: string | null
  cycleId: string | null
  overview: B2BOverviewData | undefined
}

export function B2BOverviewTab({
  companyId,
  cycleId,
  overview,
}: B2BOverviewTabProps) {
  const { data: alertsData } = useB2BAlerts(companyId, cycleId)

  const total = overview?.total ?? 0
  const rd = overview?.riskDistribution ?? {
    critical: 0,
    elevated: 0,
    moderate: 0,
    low: 0,
  }

  const kpis = [
    {
      label: 'Total Avaliados',
      value: total,
      sub: 'avaliações',
      borderColor: '#14B8A6',
      valueColor: '#14B8A6',
    },
    {
      label: 'Baixo',
      value: rd.low,
      sub: total > 0 ? `${Math.round((rd.low / total) * 100)}%` : '0%',
      borderColor: '#10B981',
      valueColor: '#10B981',
    },
    {
      label: 'Moderado',
      value: rd.moderate,
      sub: total > 0 ? `${Math.round((rd.moderate / total) * 100)}%` : '0%',
      borderColor: '#F59E0B',
      valueColor: '#F59E0B',
    },
    {
      label: 'Elevado',
      value: rd.elevated,
      sub: total > 0 ? `${Math.round((rd.elevated / total) * 100)}%` : '0%',
      borderColor: '#F97316',
      valueColor: '#F97316',
    },
    {
      label: 'Crítico',
      value: rd.critical,
      sub: total > 0 ? `${Math.round((rd.critical / total) * 100)}%` : '0%',
      borderColor: '#EF4444',
      valueColor: '#EF4444',
    },
  ]

  const pieData = (
    ['low', 'moderate', 'elevated', 'critical'] as RiskLevel[]
  )
    .map((level) => ({
      name: RISK_LABELS[level],
      value: rd[level],
      color: RISK_COLORS[level],
    }))
    .filter((d) => d.value > 0)

  const totalRisk = rd.low + rd.moderate + rd.elevated + rd.critical

  const timeline = overview?.timeline ?? []
  const TIMELINE_COLORS = {
    baixo: '#10B981',
    moderado: '#F59E0B',
    elevado: '#F97316',
    critico: '#EF4444',
  }

  const alerts = alertsData?.alerts ?? []

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] py-3.5 pl-4 pr-4"
            style={{ borderLeft: `3px solid ${k.borderColor}` }}
          >
            <p className="text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
              {k.label}
            </p>
            <p
              className="mt-1.5 text-[26px] font-bold leading-none"
              style={{ color: k.valueColor }}
            >
              {k.value}
            </p>
            <p className="mt-1 text-[11px] text-[#64748B]">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-[45fr_55fr]">
        {/* Donut chart */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-[#E2E8F0]">
            Distribuição de Risco
          </h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative" style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[28px] font-bold text-[#E2E8F0]">
                    {totalRisk || total}
                  </span>
                  <span className="text-[11px] text-[#64748B]">avaliados</span>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {pieData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-[12px]"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-[#64748B]">{d.name}</span>
                    <span className="ml-auto font-semibold text-[#E2E8F0]">
                      {d.value}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {totalRisk > 0
                        ? `${Math.round((d.value / totalRisk) * 100)}%`
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center text-[13px] text-[#64748B]">
              <span className="text-2xl font-bold text-[#E2E8F0]">{total}</span>
              <span className="mt-1">avaliados</span>
              <span className="mt-4">Sem dados de risco</span>
            </div>
          )}
        </div>

        {/* Stacked bar chart — monthly evolution */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Evolução Mensal
            </h3>
            <span className="text-[11px] text-[#64748B]">
              distribuição de risco por mês
            </span>
          </div>
          {timeline.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
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
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#132540',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    itemStyle={{ color: '#E2E8F0' }}
                  />
                  <Bar
                    dataKey="baixo"
                    name="Baixo"
                    stackId="risk"
                    fill={TIMELINE_COLORS.baixo}
                    barSize={28}
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
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-[10px] text-[#64748B]">
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
            <div className="flex h-[220px] items-center justify-center text-[13px] text-[#64748B]">
              Dados de evolução disponíveis após o segundo ciclo
            </div>
          )}
        </div>
      </div>

      {/* Alerts section */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
            Alertas
          </h3>
          {alerts.length > 0 && (
            <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-2 py-0.5 text-[10px] font-bold text-[#F87171]">
              {alerts.length}
            </span>
          )}
        </div>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.slice(0, 10).map((alert) => {
              const badge =
                URGENCY_BADGE[alert.riskLevel] ?? URGENCY_BADGE.low
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.04)] bg-[#0A1628] px-3 py-2.5"
                >
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                    }}
                  >
                    {alert.riskLevel === 'critical'
                      ? 'Crítico'
                      : alert.riskLevel === 'elevated'
                        ? 'Elevado'
                        : alert.riskLevel === 'moderate'
                          ? 'Moderado'
                          : 'Baixo'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-[#E2E8F0]">
                      Colaborador anônimo
                      {alert.department ? ` · ${alert.department}` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
            {alerts.length > 10 && (
              <p className="pt-1 text-center text-[11px] text-[#64748B]">
                +{alerts.length - 10} alertas adicionais
              </p>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-[13px] text-[#64748B]">
            Nenhum alerta neste ciclo
          </p>
        )}
      </div>
    </div>
  )
}
