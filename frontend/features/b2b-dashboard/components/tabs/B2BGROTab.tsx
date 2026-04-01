// frontend/features/b2b-dashboard/components/tabs/B2BGROTab.tsx
'use client'

import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { useB2BPercepcaoQueryHook } from '../../hooks/useB2BPercepcaoQueryHook'

const TYPE_COLORS: Record<string, string> = {
  Estresse: '#EF4444',
  Sobrecarga: '#F97316',
  'Assédio Moral': '#F59E0B',
  'Assédio Sexual': '#EC4899',
  Conflito: '#8B5CF6',
  'Condições Físicas': '#06B6D4',
  'Falta de Recursos': '#64748B',
  Discriminação: '#D946EF',
  Outro: '#94A3B8',
}

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? '#94A3B8'
}

interface B2BGROTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BGROTab({ companyId, cycleId }: B2BGROTabProps) {
  const { data: percepcao, isLoading } = useB2BPercepcaoQueryHook(
    companyId,
    cycleId ?? undefined
  )

  const pieData = useMemo(() => {
    if (!percepcao?.byType) return []
    return Object.entries(percepcao.byType)
      .map(([name, value]) => ({ name, value, color: getTypeColor(name) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [percepcao?.byType])

  const totalPie = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-[#64748B]">
        Carregando dados GRO…
      </div>
    )
  }

  const hasData = percepcao && percepcao.total > 0

  return (
    <div className="space-y-6">
      {/* GRO placeholder header */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(20,184,166,0.1)]">
            <svg
              className="h-5 w-5 text-[#14B8A6]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#E2E8F0]">
              GRO Psicossocial
            </h3>
            <p className="text-[12px] text-[#64748B]">
              Gerenciamento de riscos ocupacionais psicossociais
            </p>
          </div>
        </div>
      </div>

      {/* Percepção dos Colaboradores */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-[#E2E8F0]">
          Percepção dos Colaboradores
        </h3>

        {!hasData ? (
          <div className="flex h-40 items-center justify-center text-[13px] text-[#64748B]">
            Nenhum relato de percepção registrado ainda
          </div>
        ) : (
          <div className="space-y-5">
            {/* 4 KPI cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div
                className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A1628] py-3 pl-4 pr-4"
                style={{ borderLeft: '3px solid #14B8A6' }}
              >
                <p className="text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Total Respostas
                </p>
                <p className="mt-1.5 text-[26px] font-bold leading-none text-[#14B8A6]">
                  {percepcao.total}
                </p>
              </div>

              <div
                className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A1628] py-3 pl-4 pr-4"
                style={{ borderLeft: '3px solid #EF4444' }}
              >
                <p className="text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Urgência Alta
                </p>
                <p className="mt-1.5 text-[26px] font-bold leading-none text-[#EF4444]">
                  {percepcao.urgentes}
                </p>
              </div>

              <div
                className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A1628] py-3 pl-4 pr-4"
                style={{ borderLeft: '3px solid #60A5FA' }}
              >
                <p className="text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Setor com Mais Sinais
                </p>
                <p
                  className="mt-1.5 truncate text-[16px] font-bold leading-none text-[#60A5FA]"
                  title={percepcao.topSetor || '—'}
                >
                  {percepcao.topSetor || '—'}
                </p>
              </div>

              <div
                className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A1628] py-3 pl-4 pr-4"
                style={{ borderLeft: '3px solid #8B5CF6' }}
              >
                <p className="text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Anonimato
                </p>
                <span className="mt-1.5 inline-block rounded-full bg-[rgba(139,92,246,0.15)] px-3 py-1 text-[12px] font-semibold text-[#A78BFA]">
                  100% garantido
                </span>
              </div>
            </div>

            {/* Donut chart — distribution by type */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1628] p-4">
                <h4 className="mb-3 text-[12px] font-semibold text-[#94A3B8]">
                  Distribuição por Tipo de Fator
                </h4>
                {pieData.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-[12px] text-[#475569]">
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
                          backgroundColor: '#0E1E33',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#E2E8F0',
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

              {/* Legend */}
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1628] p-4">
                <h4 className="mb-3 text-[12px] font-semibold text-[#94A3B8]">
                  Detalhamento
                </h4>
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
                        <span className="text-[12px] text-[#94A3B8]">
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-[#E2E8F0]">
                          {entry.value}
                        </span>
                        <span className="text-[11px] text-[#64748B]">
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
          </div>
        )}
      </div>
    </div>
  )
}
