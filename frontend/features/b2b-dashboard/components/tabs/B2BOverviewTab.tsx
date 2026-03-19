'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { useB2BDepartments } from '../../hooks/useB2BDepartments'
import type { B2BOverviewData } from '../../b2b-dashboard.interface'
import type { RiskLevel } from '../../b2b-dashboard.interface'

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#10B981',
  moderate: '#F59E0B',
  elevated: '#F97316',
  critical: '#EF4444',
}

const SCORE_COLOR = (score: number) => {
  if (score >= 70) return '#10B981'
  if (score >= 65) return '#0D9488'
  if (score >= 60) return '#F59E0B'
  return '#F97316'
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
  const { data: deptData } = useB2BDepartments(companyId, cycleId)

  const total = overview?.total ?? 0
  const avgScore = overview?.avgScore ?? null
  const rd = overview?.riskDistribution ?? {
    critical: 0,
    elevated: 0,
    moderate: 0,
    low: 0,
  }

  const pieData = [
    { name: 'Baixo', value: rd.low, color: RISK_COLORS.low },
    { name: 'Moderado', value: rd.moderate, color: RISK_COLORS.moderate },
    { name: 'Elevado', value: rd.elevated, color: RISK_COLORS.elevated },
    { name: 'Crítico', value: rd.critical, color: RISK_COLORS.critical },
  ].filter((d) => d.value > 0)

  const totalRisk = rd.low + rd.moderate + rd.elevated + rd.critical

  const lineData =
    avgScore != null
      ? [{ cycle: 'Ciclo atual', score: avgScore }]
      : []

  const barData =
    deptData?.departments.map((d) => ({
      name: d.name.length > 16 ? d.name.slice(0, 16) : d.name,
      avg: d.avgScore,
      n: d.n,
      color: SCORE_COLOR(d.avgScore),
    })) ?? []

  const departments = deptData?.departments ?? []

  return (
    <div className="space-y-4">
      {/* Row 1: 65/35 grid — matches HTML .grid-65 */}
      <div className="grid gap-4 lg:grid-cols-[65fr_35fr]">
        {/* Evolução do Score Cognitivo Médio */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Evolução do Score Cognitivo Médio
            </h3>
            <span className="text-[11px] font-normal text-[#64748B]">últimos 6 ciclos</span>
          </div>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" />
                <XAxis
                  dataKey="cycle"
                  stroke="rgba(255,255,255,0.04)"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.04)"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine
                  y={64}
                  stroke="rgba(245,158,11,0.5)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fill="url(#trendFill)"
                  dot={{ fill: '#14B8A6', r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[13px] text-[#64748B]">
              Dados históricos disponíveis após o segundo ciclo
            </div>
          )}
        </div>

        {/* Distribuição de Risco — donut */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-[#E2E8F0]">
            Distribuição de Risco
          </h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative" style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
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
                  <div key={d.name} className="flex items-center gap-1.5 text-[12px]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-[#64748B]">{d.name}</span>
                    <span className="ml-auto font-semibold text-[#E2E8F0]">
                      {d.value}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {totalRisk > 0 ? `${Math.round((d.value / totalRisk) * 100)}%` : ''}
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
      </div>

      {/* Row 2: 50/50 grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Score por Departamento — horizontal bar chart */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Score por Departamento
            </h3>
            <span className="text-[11px] font-normal text-[#64748B]">média do grupo</span>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 44 + 20)}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine
                  x={64.1}
                  stroke="rgba(245,158,11,0.4)"
                  strokeWidth={1}
                />
                <Bar dataKey="avg" barSize={20} radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[13px] text-[#64748B]">
              Sem dados por departamento
            </div>
          )}
        </div>

        {/* Distribuição de Risco por Departamento (CSS stacked bars) */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-[#E2E8F0]">
            Distribuição de Risco por Departamento
          </h3>
          {departments.length > 0 ? (
            <div className="mt-1">
              {departments.map((d) => {
                const totalDept =
                  d.riskBreakdown.low +
                  d.riskBreakdown.moderate +
                  d.riskBreakdown.elevated +
                  d.riskBreakdown.critical
                const pL = totalDept > 0 ? Math.round((d.riskBreakdown.low / totalDept) * 100) : 0
                const pM = totalDept > 0 ? Math.round((d.riskBreakdown.moderate / totalDept) * 100) : 0
                const pE = totalDept > 0 ? Math.round((d.riskBreakdown.elevated / totalDept) * 100) : 0
                const pC = totalDept > 0 ? Math.round((d.riskBreakdown.critical / totalDept) * 100) : 0
                return (
                  <div key={d.name} className="mb-2.5">
                    <div className="mb-[3px] flex items-center justify-between text-[11px]">
                      <span className="text-[#94A3B8]">{d.name}</span>
                      <span className="text-[#64748B]">{totalDept} col.</span>
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded" style={{ gap: '1px' }}>
                      {totalDept > 0 ? (
                        <>
                          {pL > 0 && <div style={{ width: `${pL}%`, background: '#10B981' }} />}
                          {pM > 0 && <div style={{ width: `${pM}%`, background: '#F59E0B' }} />}
                          {pE > 0 && <div style={{ width: `${pE}%`, background: '#F97316' }} />}
                          {pC > 0 && <div style={{ width: `${pC}%`, background: '#EF4444' }} />}
                        </>
                      ) : (
                        <div className="h-full w-full bg-[#1a3a5c]" />
                      )}
                    </div>
                  </div>
                )
              })}
              <div className="mt-1.5 flex gap-3 text-[10px] text-[#64748B]">
                {[
                  ['#10B981', 'Baixo'],
                  ['#F59E0B', 'Moderado'],
                  ['#F97316', 'Elevado'],
                  ['#EF4444', 'Crítico'],
                ].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm" style={{ background: c }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[13px] text-[#64748B]">
              Sem dados por departamento
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
