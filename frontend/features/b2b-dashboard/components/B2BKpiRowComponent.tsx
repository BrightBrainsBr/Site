'use client'

import type {
  B2BComplianceData,
  B2BOverviewData,
} from '../b2b-dashboard.interface'

interface B2BKpiRowComponentProps {
  data: B2BOverviewData | undefined
  complianceData?: B2BComplianceData | null
  isLoading?: boolean
}

export function B2BKpiRowComponent({
  data,
  complianceData,
  isLoading,
}: B2BKpiRowComponentProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33]"
          />
        ))}
      </div>
    )
  }

  const total = data?.total ?? 0
  const scoreOverall = data?.scoreOverall ?? null
  const rd = data?.riskDistribution ?? {
    baixo: 0,
    moderado: 0,
    alto: 0,
    critico: 0,
  }
  const criticalElevated = (rd.critico ?? 0) + (rd.alto ?? 0)
  const coveragePct = complianceData?.coveragePct ?? null
  const groIssued = !!complianceData?.groIssuedAt

  const kpis = [
    {
      label: 'Total avaliados',
      value: total,
      valueColor: '#14B8A6',
      sub: `de ${total} elegíveis · ${coveragePct != null ? coveragePct + '%' : '–'} adesão`,
      borderColor: '#0D9488',
    },
    {
      label: 'Conformidade',
      value: coveragePct != null ? `${coveragePct}%` : '–',
      valueColor: '#34D399',
      sub: groIssued
        ? 'GRO emitido · laudo CFM assinado'
        : 'GRO pendente · documentação em análise',
      borderColor: '#34D399',
    },
    {
      label: 'Score geral médio',
      value: scoreOverall != null ? scoreOverall.toFixed(1) : '–',
      valueColor: '#3B82F6',
      sub: 'Média domínios NR-1 · escala 1–5',
      borderColor: '#3B82F6',
    },
    {
      label: 'Em risco alto/crítico',
      value: criticalElevated,
      valueColor: '#FB923C',
      sub: 'Delta vs ciclo anterior em construção',
      borderColor: '#FB923C',
    },
    {
      label: 'Alertas pendentes',
      value: data?.alertCount ?? 0,
      valueColor: '#A78BFA',
      sub: `${data?.incidentsThisCycle ?? 0} incidentes neste ciclo`,
      borderColor: '#A78BFA',
    },
  ]

  return (
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
  )
}
