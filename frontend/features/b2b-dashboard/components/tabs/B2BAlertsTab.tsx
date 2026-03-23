'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts'

import type { B2BAlertData } from '../../b2b-dashboard.interface'
import { DOMAIN_DISPLAY_NAMES } from '../../constants/domain-mapping'
import { useB2BAlerts } from '../../hooks/useB2BAlerts'
import { useB2BOverview } from '../../hooks/useB2BOverview'

const RISK_COLORS: Record<string, string> = {
  critical: '#EF4444',
  elevated: '#F97316',
  moderate: '#F59E0B',
  low: '#10B981',
}

const ACTION_PLAN = [
  {
    level: 'Crítico',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    actions: [
      'Contato imediato pelo RH (≤48h)',
      'Avaliação clínica presencial com psiquiatra ou neuropsicólogo',
      'Afastamento preventivo conforme legislação',
      'Notificação ao gestor imediato (sem identificar dados clínicos)',
    ],
  },
  {
    level: 'Elevado',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.08)',
    actions: [
      'Contato do RH em até 5 dias úteis',
      'Revisão de carga operacional com gestor',
      'Oferta de suporte de saúde mental via convênio',
      'Reavaliação em 60 dias',
    ],
  },
  {
    level: 'Moderado',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    actions: [
      'Comunicação sobre programas de bem-estar disponíveis',
      'Check-in de gestor no próximo 1-on-1',
      'Reavaliação no próximo ciclo (6 meses)',
    ],
  },
]

interface B2BAlertsTabProps {
  companyId: string | null
  cycleId: string | null
}

function DomainTags({
  domainScores,
}: {
  domainScores?: Record<string, number>
}) {
  if (!domainScores || Object.keys(domainScores).length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {Object.entries(domainScores).map(([key, value]) => (
        <span
          key={key}
          className="rounded-xl bg-[rgba(255,255,255,0.06)] px-[7px] py-[2px] text-[10px] text-[#94A3B8]"
        >
          {DOMAIN_DISPLAY_NAMES[key] ?? key}
        </span>
      ))}
    </div>
  )
}

export function B2BAlertsTab({ companyId, cycleId }: B2BAlertsTabProps) {
  const { data, isLoading } = useB2BAlerts(companyId, cycleId)
  const { data: overview } = useB2BOverview(companyId, cycleId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
      </div>
    )
  }

  const alerts = data?.alerts ?? []
  const criticalAlerts = alerts.filter((a) => a.riskLevel === 'critical')
  const elevatedAlerts = alerts.filter((a) => a.riskLevel === 'elevated')
  const moderateAlerts = alerts.filter((a) => a.riskLevel === 'moderate')

  const rd = overview?.riskDistribution ?? {
    low: 0,
    moderate: 0,
    elevated: 0,
    critical: 0,
  }
  const statsPieData = [
    { name: 'Baixo', value: rd.low, color: RISK_COLORS.low },
    { name: 'Moderado', value: rd.moderate, color: RISK_COLORS.moderate },
    { name: 'Elevado', value: rd.elevated, color: RISK_COLORS.elevated },
    { name: 'Crítico', value: rd.critical, color: RISK_COLORS.critical },
  ].filter((d) => d.value > 0)

  const costNoAction = rd.critical * 95000 * 0.05 + rd.elevated * 95000 * 0.02
  const costIntervention = 24000
  const savings = costNoAction - costIntervention

  return (
    <div className="space-y-4">
      {/* LGPD disclaimer */}
      <div className="rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.06)] px-4 py-3 text-[13px]">
        <span className="font-semibold text-[#F87171]">⚠ Importante:</span>{' '}
        <span className="text-[#94A3B8]">
          Todos os identificadores são anonimizados. Laudos clínicos individuais
          são acessíveis somente pelo próprio colaborador. Esta visão agrega
          risco sem expor dados pessoais — conforme LGPD.
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Alert cards grouped by level */}
        <div>
          {criticalAlerts.length > 0 && (
            <>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#F87171]">
                Risco Crítico — {criticalAlerts.length} colaborador
                {criticalAlerts.length > 1 ? 'es' : ''}
              </p>
              <div className="space-y-2.5">
                {criticalAlerts.map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </div>
            </>
          )}

          {elevatedAlerts.length > 0 && (
            <>
              <p className="mb-2.5 mt-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#FB923C]">
                Risco Elevado — {elevatedAlerts.length} colaborador
                {elevatedAlerts.length > 1 ? 'es' : ''}
              </p>
              <div className="space-y-2.5">
                {elevatedAlerts.map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </div>
            </>
          )}

          {moderateAlerts.length > 0 && (
            <>
              <p className="mb-2.5 mt-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#FBBF24]">
                Risco Moderado com Vigilância — {moderateAlerts.length}{' '}
                colaborador{moderateAlerts.length > 1 ? 'es' : ''}
              </p>
              <div className="space-y-2.5">
                {moderateAlerts.map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </div>
            </>
          )}

          {alerts.length === 0 && (
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-8 text-center">
              <p className="text-[13px] text-[#64748B]">
                Nenhum alerta de risco elevado/crítico para este ciclo.
              </p>
            </div>
          )}
        </div>

        {/* Right: Action plan + Stats */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
            <h3 className="mb-4 text-[13px] font-semibold text-[#E2E8F0]">
              Plano de Ação Recomendado
            </h3>
            <div className="space-y-2.5">
              {ACTION_PLAN.map((p) => (
                <div
                  key={p.level}
                  className="rounded-r-lg py-2.5 pl-3 pr-3"
                  style={{
                    borderLeft: `3px solid ${p.color}`,
                    background: p.bg,
                  }}
                >
                  <p
                    className="mb-1.5 text-[12px] font-semibold"
                    style={{ color: p.color }}
                  >
                    Risco {p.level}
                  </p>
                  {p.actions.map((action, i) => (
                    <p key={i} className="mb-0.5 text-[11px] text-[#94A3B8]">
                      • {action}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
            <h3 className="mb-4 text-[13px] font-semibold text-[#E2E8F0]">
              Estatísticas de Risco
            </h3>
            {statsPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statsPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={0}
                  >
                    {statsPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value) => (
                      <span style={{ color: '#94A3B8' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-[13px] text-[#64748B]">
                Sem dados de risco para exibir
              </p>
            )}

            <div className="mt-3 border-t border-[rgba(255,255,255,0.08)] pt-3">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] py-1.5 text-[12px]">
                <span className="text-[#94A3B8]">
                  Custo estimado sem intervenção
                </span>
                <span className="font-semibold text-[#F87171]">
                  {costNoAction > 0
                    ? `R$ ${Math.round(costNoAction / 1000)}K`
                    : 'R$ —'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] py-1.5 text-[12px]">
                <span className="text-[#94A3B8]">
                  Custo de intervenção preventiva
                </span>
                <span className="font-semibold text-[#34D399]">R$ 24.000</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-[12px]">
                <span className="text-[#94A3B8]">Potencial de economia</span>
                <span className="font-semibold text-[#14B8A6]">
                  {savings > 0 ? `R$ ${Math.round(savings / 1000)}K` : 'R$ —'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertCard({ alert }: { alert: B2BAlertData }) {
  const levelMap: Record<
    string,
    {
      border: string
      bg: string
      badge: string
      badgeBg: string
      label: string
    }
  > = {
    critical: {
      border: 'rgba(239,68,68,0.3)',
      bg: 'rgba(239,68,68,0.05)',
      badge: '#F87171',
      badgeBg: 'rgba(239,68,68,0.2)',
      label: 'CRÍTICO',
    },
    elevated: {
      border: 'rgba(249,115,22,0.3)',
      bg: 'rgba(249,115,22,0.05)',
      badge: '#FB923C',
      badgeBg: 'rgba(249,115,22,0.2)',
      label: 'ELEVADO',
    },
    moderate: {
      border: 'rgba(245,158,11,0.3)',
      bg: 'rgba(245,158,11,0.05)',
      badge: '#FBBF24',
      badgeBg: 'rgba(245,158,11,0.2)',
      label: 'MODERADO',
    },
  }
  const style = levelMap[alert.riskLevel] ?? levelMap.moderate

  return (
    <div
      className="rounded-xl p-3"
      style={{
        border: `1px solid ${style.border}`,
        background: style.bg,
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="rounded-xl px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.5px]"
          style={{ background: style.badgeBg, color: style.badge }}
        >
          {style.label}
        </span>
        <span className="text-[12px] font-semibold text-[#E2E8F0]">
          ID Anônimo: {alert.id}
        </span>
        <span className="ml-auto text-[11px] text-[#64748B]">
          {alert.department ?? '–'}
        </span>
      </div>
      <p className="mb-2 text-[12px] text-[#94A3B8]">
        Avaliação com scores em domínios de atenção
      </p>
      <DomainTags domainScores={alert.domainScores} />
    </div>
  )
}
