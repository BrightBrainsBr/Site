// frontend/features/b2b-dashboard/components/tabs/B2BPercepcaoTab.tsx
'use client'

import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { useB2BPercepcaoQueryHook } from '../../hooks/useB2BPercepcaoQueryHook'

const TYPE_COLORS: Record<string, string> = {
  estresse: '#ef4444',
  sobrecarga: '#f97316',
  assedio_moral: '#eab308',
  assedio_sexual: '#ec4899',
  conflito: '#8b5cf6',
  condicoes_fisicas: '#06b6d4',
  falta_recursos: '#64748b',
  discriminacao: '#d946ef',
  outro: '#94a3b8',
}

const TYPE_LABELS: Record<string, string> = {
  estresse: 'Estresse',
  sobrecarga: 'Sobrecarga',
  assedio_moral: 'Assédio Moral',
  assedio_sexual: 'Assédio Sexual',
  conflito: 'Conflito',
  condicoes_fisicas: 'Condições Físicas',
  falta_recursos: 'Falta de Recursos',
  discriminacao: 'Discriminação',
  outro: 'Outro',
}

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? '#94a3b8'
}

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type
}

interface B2BPercepcaoTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BPercepcaoTab({ companyId, cycleId }: B2BPercepcaoTabProps) {
  const { data: percepcao, isLoading } = useB2BPercepcaoQueryHook(
    companyId,
    cycleId ?? undefined
  )

  const pieData = useMemo(() => {
    if (!percepcao?.byType) return []
    return Object.entries(percepcao.byType)
      .map(([key, value]) => ({ key, name: getTypeLabel(key), value, color: getTypeColor(key) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [percepcao?.byType])

  const totalPie = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-[#64748b]">
        Carregando dados de percepção…
      </div>
    )
  }

  const hasData = percepcao && percepcao.total > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">💬</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            Percepção Organizacional
          </h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[13px] text-[#64748b]">
          Fatores de risco identificados nas respostas abertas dos colaboradores
          — Ref. NR-1: 1.5.3.3 · Dados 100% agregados e anônimos
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-[14px] border border-[rgba(197,225,85,0.1)] bg-[rgba(197,225,85,0.04)] px-3.5 py-2.5">
        <p className="text-[11px] leading-relaxed text-[#d4ec7e]">
          <strong>O que é esta aba:</strong> consolidação das respostas abertas
          dos formulários AEP (Q15 — &quot;Percepção Livre&quot;) e do Canal de
          Percepção de Riscos integrado ao formulário. Nenhum dado é rastreado
          individualmente — só padrões agregados por setor e tipo de fator.
        </p>
        <p className="mt-1 text-[10px] text-[#64748b]">
          Não é um canal de denúncias (a empresa mantém o seu próprio canal).
          Esta aba analisa o que os colaboradores percebem como fator de risco no
          trabalho.
        </p>
      </div>

      {!hasData ? (
        <div className="flex h-40 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[13px] text-[#64748b]">
          Nenhum relato de percepção registrado ainda
        </div>
      ) : (
        <>
          {/* 4 KPI cards */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4 text-center">
              <div className="text-[22px]">💬</div>
              <div className="mt-1 font-mono text-[32px] font-bold leading-none tracking-tight text-[#c5e155]">
                {percepcao.total}
              </div>
              <div className="mt-1.5 text-[12px] text-[#94a3b8]">
                Respostas Abertas
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.04)] p-4 text-center">
              <div className="text-[22px]">⚠️</div>
              <div className="mt-1 font-mono text-[32px] font-bold leading-none tracking-tight text-[#ef4444]">
                {percepcao.urgentes}
              </div>
              <div className="mt-1.5 text-[12px] text-[#94a3b8]">
                Urgência Alta
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4 text-center">
              <div className="text-[22px]">📍</div>
              <div className="mt-1 truncate text-[18px] font-bold leading-none text-[#f97316]">
                {percepcao.topSetor || '—'}
              </div>
              <div className="mt-1.5 text-[12px] text-[#94a3b8]">
                Setor com Mais Sinais
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(34,197,94,0.15)] bg-[rgba(34,197,94,0.04)] p-4 text-center">
              <div className="text-[22px]">🔒</div>
              <div className="mt-1 font-mono text-[32px] font-bold leading-none tracking-tight text-[#22c55e]">
                100%
              </div>
              <div className="mt-1.5 text-[12px] text-[#94a3b8]">Anonimato</div>
            </div>
          </div>

          {/* Donut + Legend */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[15px] font-semibold text-[#e2e8f0]">
                Fatores de Risco Mencionados
              </h3>
              {pieData.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-[12px] text-[#64748b]">
                  Sem dados para exibir
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
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
                      formatter={(value, name) => [
                        `${value} (${totalPie > 0 ? Math.round((Number(value) / totalPie) * 100) : 0}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[15px] font-semibold text-[#e2e8f0]">
                Detalhamento
              </h3>
              <div className="space-y-2">
                {pieData.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-[12px] text-[#94a3b8]">
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[#e2e8f0]">
                        {entry.value}
                      </span>
                      <span className="text-[11px] text-[#64748b]">
                        {totalPie > 0
                          ? `${Math.round((entry.value / totalPie) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Correlations */}
          {percepcao.correlations && percepcao.correlations.length > 0 && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[15px] font-semibold text-[#e2e8f0]">
                Correlação com Dados do Inventário
              </h3>
              <p className="mb-3 text-[11px] text-[#94a3b8]">
                Padrões cruzados automaticamente com scores AEP/SRQ-20:
              </p>
              <div className="space-y-2">
                {percepcao.correlations.map((c, i) => {
                  const isHigh =
                    c.severity === 'alta' ||
                    c.severity === 'critical' ||
                    c.severity === 'high'
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg bg-[rgba(255,255,255,0.02)] px-3 py-2"
                    >
                      <span
                        className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          color: isHigh ? '#ef4444' : '#eab308',
                          backgroundColor: isHigh
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(234,179,8,0.15)',
                          border: isHigh
                            ? '1px solid rgba(239,68,68,0.3)'
                            : '1px solid rgba(234,179,8,0.3)',
                        }}
                      >
                        {isHigh ? 'Alta' : 'Média'}
                      </span>
                      <span className="text-[11px] text-[#e2e8f0]">
                        {c.description}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
