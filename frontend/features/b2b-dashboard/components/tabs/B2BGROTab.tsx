// frontend/features/b2b-dashboard/components/tabs/B2BGROTab.tsx
'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { NR1RiskBand } from '../../b2b-dashboard.interface'
import { useB2BGROQueryHook } from '../../hooks/useB2BGROQueryHook'

const NR1_BAND_COLORS: Record<NR1RiskBand, string> = {
  baixo: '#22c55e',
  moderado: '#eab308',
  alto: '#f97316',
  critico: '#ef4444',
}

const MATRIX_COLORS = [
  ['#eab308', '#f97316', '#ef4444', '#ef4444'],
  ['#22c55e', '#eab308', '#f97316', '#ef4444'],
  ['#22c55e', '#22c55e', '#eab308', '#f97316'],
]

const EVENT_TYPE_LABELS: Record<string, string> = {
  acidente: 'Acidente',
  incidente: 'Incidente',
  near_miss: 'Quase-acidente',
  work_disease: 'Doença Ocupacional',
  afastamento: 'Afastamento',
  relato_canal: 'Relato Canal',
  atestado: 'Atestado',
  outro: 'Outro',
}

interface B2BGROTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BGROTab({ companyId, cycleId }: B2BGROTabProps) {
  const { data: gro, isLoading } = useB2BGROQueryHook(companyId, {
    cycle: cycleId ?? undefined,
  })

  const chemicalData = useMemo(() => {
    if (!gro?.chemicalExposures) return []
    return Object.entries(gro.chemicalExposures)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [gro?.chemicalExposures])

  const biologicalData = useMemo(() => {
    if (!gro?.biologicalExposures) return []
    return Object.entries(gro.biologicalExposures)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [gro?.biologicalExposures])

  const incidentData = useMemo(() => {
    if (!gro?.incidentsByType) return []
    return Object.entries(gro.incidentsByType)
      .map(([type, count]) => ({
        name: EVENT_TYPE_LABELS[type] ?? type,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [gro?.incidentsByType])

  const matrix = gro?.riskMatrix ?? []
  const domainSummary = gro?.domainSummary ?? []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[14px] text-[#64748b]">
        Carregando dados GRO…
      </div>
    )
  }

  const noData =
    domainSummary.length === 0 &&
    chemicalData.length === 0 &&
    biologicalData.length === 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">⚖️</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            GRO — Inventário de Riscos NR-1
          </h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Gerenciamento de Riscos Ocupacionais — Consolidado por domínio,
          exposição e incidentes
        </p>
      </div>

      {noData ? (
        <div className="flex flex-col items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-6 py-16 text-center">
          <span className="text-[32px]">⚖️</span>
          <h3 className="mt-3 text-[18px] font-semibold text-[#e2e8f0]">
            Nenhum dado GRO disponível
          </h3>
          <p className="mt-2 max-w-md text-[14px] text-[#94a3b8]">
            Os indicadores de GRO são gerados automaticamente a partir das
            avaliações NR-1 dos colaboradores.
          </p>
        </div>
      ) : (
        <>
          {/* Domain score summary cards */}
          {domainSummary.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
              {domainSummary.map((d) => {
                const color = d.band
                  ? NR1_BAND_COLORS[d.band]
                  : '#64748b'
                return (
                  <div
                    key={d.label}
                    className="rounded-[14px] border bg-[rgba(255,255,255,0.03)] p-4 text-center"
                    style={{ borderColor: `${color}40` }}
                  >
                    <div
                      className="font-mono text-[28px] font-bold leading-none tracking-tight"
                      style={{ color }}
                    >
                      {d.score != null ? d.score.toFixed(1) : '–'}
                    </div>
                    <div className="mt-1.5 text-[14px] text-[#94a3b8]">
                      {d.label}
                    </div>
                    {d.band && (
                      <span
                        className="mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                        }}
                      >
                        {d.band.charAt(0).toUpperCase() + d.band.slice(1)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Exposure charts row */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Chemical exposures */}
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
                Exposições Químicas
              </h3>
              {chemicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, chemicalData.length * 36)}>
                  <BarChart
                    data={chemicalData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={130}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b2e',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Relatos"
                      fill="#f97316"
                      radius={[0, 6, 6, 0]}
                      barSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-[15px] text-[#64748b]">
                  Nenhuma exposição química relatada
                </div>
              )}
            </div>

            {/* Biological exposures */}
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
                Exposições Biológicas
              </h3>
              {biologicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, biologicalData.length * 36)}>
                  <BarChart
                    data={biologicalData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={130}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111b2e',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Relatos"
                      fill="#14b8a6"
                      radius={[0, 6, 6, 0]}
                      barSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-[15px] text-[#64748b]">
                  Nenhuma exposição biológica relatada
                </div>
              )}
            </div>
          </div>

          {/* Incidents by type */}
          {incidentData.length > 0 && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
                Incidentes por Tipo
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={incidentData}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111b2e',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Quantidade"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  >
                    {incidentData.map((_, i) => (
                      <Cell key={i} fill="#ef4444" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Risk matrix */}
          {matrix.length > 0 && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
                Matriz de Risco — Domínio × Severidade
              </h3>
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: '100px repeat(4, 1fr)' }}
              >
                <div />
                {['Baixo', 'Moderado', 'Alto', 'Crítico'].map((h) => (
                  <div
                    key={h}
                    className="rounded p-2 text-center text-[13px] font-semibold text-[#94a3b8]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {h}
                  </div>
                ))}

                {['Overall ≥ 4', 'Overall 3–4', 'Overall < 3'].map(
                  (rowLabel, rowIdx) => (
                    <div key={rowIdx} className="contents">
                      <div
                        className="flex items-center text-[13px] font-semibold text-[#94a3b8]"
                        style={{ padding: '8px' }}
                      >
                        {rowLabel}
                      </div>
                      {[0, 1, 2, 3].map((colIdx) => {
                        const value = matrix[rowIdx]?.[colIdx] ?? 0
                        const color =
                          MATRIX_COLORS[rowIdx]?.[colIdx] ?? '#64748b'
                        return (
                          <div
                            key={`cell-${rowIdx}-${colIdx}`}
                            className="rounded p-2.5 text-center font-mono text-[17px] font-bold"
                            style={{ background: `${color}20`, color }}
                          >
                            {value}
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
              <div className="mt-2 text-center text-[13px] text-[#64748b]">
                Número de colaboradores por célula da matriz · Ref. NR-1:
                1.5.4.4.2
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
