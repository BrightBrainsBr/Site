'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import {
  DOMAIN_DISPLAY_NAMES,
  DOMAIN_MAX_SCORES,
} from '../../constants/domain-mapping'
import { useB2BDomains } from '../../hooks/useB2BDomains'

interface B2BDomainsTabProps {
  companyId: string | null
  cycleId: string | null
}

function normalizeToHealthScore(rawAvg: number, maxScore: number): number {
  if (maxScore <= 0) return 0
  return Math.round((100 - (rawAvg / maxScore) * 100) * 10) / 10
}

function barColor(score: number): string {
  if (score >= 70) return '#14B8A6'
  if (score >= 60) return '#3B82F6'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

const BENCHMARK = 64

interface DomainRow {
  key: string
  displayName: string
  rawAvg: number | null
  healthScore: number | null
  n: number
}

const DIST_BUCKETS = [
  { label: '0–30', color: '#EF4444' },
  { label: '31–40', color: '#EF4444' },
  { label: '41–50', color: '#F97316' },
  { label: '51–60', color: '#F59E0B' },
  { label: '61–70', color: '#0D9488' },
  { label: '71–80', color: '#10B981' },
  { label: '81–90', color: '#34D399' },
  { label: '91–100', color: '#34D399' },
]

function buildDistribution(
  rows: DomainRow[]
): { label: string; count: number; color: string }[] {
  const counts = new Array(8).fill(0)
  rows.forEach((r) => {
    const s = r.healthScore ?? 0
    if (s <= 30) counts[0]++
    else if (s <= 40) counts[1]++
    else if (s <= 50) counts[2]++
    else if (s <= 60) counts[3]++
    else if (s <= 70) counts[4]++
    else if (s <= 80) counts[5]++
    else if (s <= 90) counts[6]++
    else counts[7]++
  })
  return DIST_BUCKETS.map((b, i) => ({
    label: b.label,
    count: counts[i],
    color: b.color,
  }))
}

export function B2BDomainsTab({ companyId, cycleId }: B2BDomainsTabProps) {
  const { data, isLoading } = useB2BDomains(companyId, cycleId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
      </div>
    )
  }

  const domains = data?.domains ?? []
  const rows: DomainRow[] = domains
    .filter((d) => d.avg != null)
    .map((d) => {
      const maxScore = DOMAIN_MAX_SCORES[d.key] ?? 100
      const rawAvg = d.avg!
      const healthScore = normalizeToHealthScore(rawAvg, maxScore)
      return {
        key: d.key,
        displayName: DOMAIN_DISPLAY_NAMES[d.key] ?? d.name ?? d.key,
        rawAvg,
        healthScore,
        n: d.n,
      }
    })
    .sort((a, b) => (b.healthScore ?? 0) - (a.healthScore ?? 0))

  const criticalDomains = rows.filter(
    (r) => r.healthScore != null && r.healthScore < 60
  )
  const strongDomains = rows.filter(
    (r) => r.healthScore != null && r.healthScore >= 70
  )
  const distData = buildDistribution(rows)

  return (
    <div className="grid gap-4 lg:grid-cols-[65fr_35fr]">
      {/* Left: Perfil Cognitivo da Organização */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
            Perfil Cognitivo da Organização
          </h3>
          <span className="text-[11px] text-[#64748B]">
            score médio por domínio (0–100)
          </span>
        </div>
        <div className="mb-2 flex gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-[#64748B]">
            <span className="inline-block h-[3px] w-3 rounded bg-[#0D9488]" />
            Score atual
          </span>
          <span className="flex items-center gap-1.5 text-[#64748B]">
            <span className="inline-block h-[3px] w-3 rounded border border-dashed border-[#F59E0B]" />
            Benchmark setor
          </span>
        </div>
        {rows.length > 0 ? (
          <div className="space-y-1.5">
            {rows.map((r) => {
              const score = r.healthScore ?? 0
              const color = barColor(score)
              const delta = Math.round(score - BENCHMARK)
              const aboveBench = delta >= 0
              return (
                <div key={r.key} className="flex items-center gap-1.5 md:gap-2">
                  <span
                    className="w-[100px] shrink-0 truncate text-[10px] text-[#94A3B8] md:w-[145px] md:text-[11px]"
                    title={r.displayName}
                  >
                    {r.displayName}
                  </span>
                  <div className="relative h-[6px] flex-1 overflow-visible rounded bg-[rgba(255,255,255,0.05)]">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.min(100, Math.max(0, score))}%`,
                        backgroundColor: color,
                      }}
                    />
                    <div
                      className="absolute top-[-3px] h-[12px] w-[2px] rounded-full bg-[#F59E0B] opacity-60"
                      style={{ left: `${BENCHMARK}%` }}
                    />
                  </div>
                  <span
                    className="w-7 shrink-0 text-right text-[11px] font-semibold"
                    style={{ color }}
                  >
                    {Math.round(score)}
                  </span>
                  <span
                    className="w-[50px] shrink-0 text-right text-[10px]"
                    style={{ color: aboveBench ? '#34D399' : '#F87171' }}
                  >
                    {aboveBench ? '▲' : '▼'}
                    {Math.abs(delta)} bm
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-[13px] text-[#64748B]">
            Nenhum dado de domínio para este ciclo.
          </p>
        )}
      </div>

      {/* Right: Distribution chart + Critical + Strong */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-[#E2E8F0]">
          Distribuição de Scores
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={distData}
            margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
              {distData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Domínios Críticos
            </h3>
            <span className="text-[11px] text-[#64748B]">abaixo de 60</span>
          </div>
          {criticalDomains.length > 0 ? (
            <div className="mt-2">
              {criticalDomains.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] py-[7px] text-[12px]"
                >
                  <span className="text-[#E2E8F0]">{r.displayName}</span>
                  <span className="rounded-lg bg-[rgba(239,68,68,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#F87171]">
                    {Math.round(r.healthScore ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-[#64748B]">
              Nenhum domínio crítico — excelente!
            </p>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Pontos Fortes
            </h3>
            <span className="text-[11px] text-[#64748B]">acima de 70</span>
          </div>
          {strongDomains.length > 0 ? (
            <div className="mt-2">
              {strongDomains.slice(0, 4).map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] py-[7px] text-[12px]"
                >
                  <span className="text-[#E2E8F0]">{r.displayName}</span>
                  <span className="rounded-lg bg-[rgba(16,185,129,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#34D399]">
                    {Math.round(r.healthScore ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-[#64748B]">
              Nenhum ponto forte identificado
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
