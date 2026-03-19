'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { useB2BDepartments } from '../../hooks/useB2BDepartments'
import type { B2BDepartmentData } from '../../b2b-dashboard.interface'
import type { RiskLevel } from '../../b2b-dashboard.interface'

const SCORE_CHIP_STYLE = (score: number) => {
  if (score >= 70) return { bg: 'rgba(52,211,153,0.1)', color: '#34D399' }
  if (score >= 65) return { bg: 'rgba(20,184,166,0.1)', color: '#14B8A6' }
  if (score >= 60) return { bg: 'rgba(251,191,36,0.1)', color: '#FBBF24' }
  return { bg: 'rgba(251,146,60,0.1)', color: '#FB923C' }
}

const TREND_LABEL = (trend: 'up' | 'down' | 'stable' | null) => {
  if (trend === 'up') return { text: '↑ Melhora', color: '#34D399' }
  if (trend === 'down') return { text: '↓ Atenção', color: '#F87171' }
  if (trend === 'stable') return { text: '→ Estável', color: '#FBBF24' }
  return { text: '–', color: '#64748B' }
}

const RISK_FACTORS = [
  { label: 'Burnout moderado a severo', color: '#EF4444', pct: 78 },
  { label: 'Regulação emocional comprometida', color: '#F97316', pct: 61 },
  { label: 'Resiliência baixa ao estresse', color: '#F59E0B', pct: 55 },
  { label: 'Atenção sustentada reduzida', color: '#FBBF24', pct: 48 },
  { label: 'Memória de trabalho prejudicada', color: '#A78BFA', pct: 43 },
  { label: 'Tomada de decisão comprometida', color: '#3B82F6', pct: 38 },
  { label: 'Baixo bem-estar subjetivo', color: '#0D9488', pct: 35 },
] as const

const HIERARCHY_DATA = [
  { name: 'C-level', elevado: 8, critico: 2 },
  { name: 'Gerência', elevado: 18, critico: 5 },
  { name: 'Coord./Sênior', elevado: 32, critico: 12 },
  { name: 'Pleno', elevado: 24, critico: 8 },
  { name: 'Júnior', elevado: 18, critico: 3 },
]

interface B2BRiskMapTabProps {
  companyId: string | null
  cycleId: string | null
}

function MiniStackedBar({ dept }: { dept: B2BDepartmentData }) {
  const total =
    dept.riskBreakdown.low +
    dept.riskBreakdown.moderate +
    dept.riskBreakdown.elevated +
    dept.riskBreakdown.critical
  if (total === 0) {
    return <div className="h-[6px] w-[60px] rounded bg-[#1a3a5c]" />
  }
  const px = (n: number) => Math.max(n > 0 ? 2 : 0, Math.round((n / total) * 60))
  return (
    <div className="flex items-center gap-[2px]">
      <div className="rounded-sm bg-[#10B981]" style={{ width: px(dept.riskBreakdown.low), height: 6 }} />
      <div className="rounded-sm bg-[#F59E0B]" style={{ width: px(dept.riskBreakdown.moderate), height: 6 }} />
      <div className="rounded-sm bg-[#F97316]" style={{ width: px(dept.riskBreakdown.elevated), height: 6 }} />
      <div className="rounded-sm bg-[#EF4444]" style={{ width: px(dept.riskBreakdown.critical), height: 6 }} />
    </div>
  )
}

export function B2BRiskMapTab({ companyId, cycleId }: B2BRiskMapTabProps) {
  const { data, isLoading } = useB2BDepartments(companyId, cycleId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
      </div>
    )
  }

  const departments = data?.departments ?? []

  return (
    <div className="space-y-4">
      {/* Department table */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33]">
        <div className="mb-0 flex items-center justify-between px-4 pt-3">
          <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
            Mapa de Risco por Departamento
          </h3>
          <span className="text-[11px] text-[#64748B]">
            intensidade = volume de colaboradores em risco
          </span>
        </div>
        <table className="w-full min-w-[700px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Departamento</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Total</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Score Méd.</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#34D399]">Baixo</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#FBBF24]">Moderado</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#FB923C]">Elevado</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#F87171]">Crítico</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Distribuição</th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Tendência</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => {
              const trendInfo = TREND_LABEL(d.trend)
              const chipStyle = SCORE_CHIP_STYLE(d.avgScore)
              return (
                <tr key={d.name} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <td className="px-2 py-2 text-[12px] font-medium text-[#E2E8F0]">{d.name}</td>
                  <td className="px-2 py-2 text-[#94A3B8]">{d.n}</td>
                  <td className="px-2 py-2">
                    <span
                      className="inline-flex h-[22px] w-[42px] items-center justify-center rounded-md text-[11px] font-bold"
                      style={{ background: chipStyle.bg, color: chipStyle.color }}
                    >
                      {d.avgScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-semibold text-[#34D399]">{d.riskBreakdown.low}</td>
                  <td className="px-2 py-2 font-semibold text-[#FBBF24]">{d.riskBreakdown.moderate}</td>
                  <td className="px-2 py-2 font-semibold text-[#FB923C]">{d.riskBreakdown.elevated}</td>
                  <td className="px-2 py-2 font-semibold text-[#F87171]">{d.riskBreakdown.critical}</td>
                  <td className="px-2 py-2">
                    <MiniStackedBar dept={d} />
                  </td>
                  <td className="px-2 py-2 text-[12px]" style={{ color: trendInfo.color }}>
                    {trendInfo.text}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {departments.length === 0 && (
          <p className="py-12 text-center text-[13px] text-[#64748B]">
            Nenhum dado de departamento para este ciclo.
          </p>
        )}
      </div>

      {/* Row 2: Hierarchy chart + Risk factors */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Risco por Nível Hierárquico */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <h3 className="mb-4 text-[13px] font-semibold text-[#E2E8F0]">
            Risco por Nível Hierárquico
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={HIERARCHY_DATA} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => <span style={{ color: '#94A3B8' }}>{value}</span>}
                iconSize={10}
              />
              <Bar dataKey="elevado" name="Elevado" stackId="a" fill="rgba(249,115,22,0.8)" radius={[0, 0, 0, 0]} barSize={32} />
              <Bar dataKey="critico" name="Crítico" stackId="a" fill="rgba(239,68,68,0.8)" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fatores de Risco Mais Frequentes */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Fatores de Risco Mais Frequentes
            </h3>
            <span className="text-[11px] text-[#64748B]">colaboradores em risco elevado/crítico</span>
          </div>
          <div className="space-y-2">
            {RISK_FACTORS.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 text-[12px]">
                <span className="w-[100px] shrink-0 text-[11px] text-[#94A3B8]">{f.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-[rgba(255,255,255,0.05)]">
                  <div
                    className="h-full rounded"
                    style={{ width: `${f.pct}%`, backgroundColor: f.color, opacity: 0.8 }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-[11px] text-[#64748B]">{f.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
