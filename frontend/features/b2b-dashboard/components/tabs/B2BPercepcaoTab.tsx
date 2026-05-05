// frontend/features/b2b-dashboard/components/tabs/B2BPercepcaoTab.tsx
'use client'

import { useB2BPercepcaoQueryHook } from '../../hooks/useB2BPercepcaoQueryHook'

interface ScaleCardDef {
  key: 'phq9' | 'gad7' | 'isi' | 'mbi'
  label: string
  fullName: string
  description: string
  thresholds: { label: string; min: number; color: string }[]
}

const SCALE_CARDS: ScaleCardDef[] = [
  {
    key: 'phq9',
    label: 'PHQ-9',
    fullName: 'Patient Health Questionnaire',
    description: 'Rastreio de sintomas depressivos',
    thresholds: [
      { label: 'Mínimo', min: 0, color: '#22c55e' },
      { label: 'Leve', min: 5, color: '#eab308' },
      { label: 'Moderado', min: 10, color: '#f97316' },
      { label: 'Mod. Grave', min: 15, color: '#ef4444' },
      { label: 'Grave', min: 20, color: '#dc2626' },
    ],
  },
  {
    key: 'gad7',
    label: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder',
    description: 'Rastreio de transtorno de ansiedade',
    thresholds: [
      { label: 'Mínimo', min: 0, color: '#22c55e' },
      { label: 'Leve', min: 5, color: '#eab308' },
      { label: 'Moderado', min: 10, color: '#f97316' },
      { label: 'Grave', min: 15, color: '#ef4444' },
    ],
  },
  {
    key: 'isi',
    label: 'ISI',
    fullName: 'Insomnia Severity Index',
    description: 'Avaliação de gravidade da insônia',
    thresholds: [
      { label: 'Sem insônia', min: 0, color: '#22c55e' },
      { label: 'Subliminar', min: 8, color: '#eab308' },
      { label: 'Moderada', min: 15, color: '#f97316' },
      { label: 'Grave', min: 22, color: '#ef4444' },
    ],
  },
  {
    key: 'mbi',
    label: 'MBI',
    fullName: 'Maslach Burnout Inventory',
    description: 'Avaliação de esgotamento profissional',
    thresholds: [
      { label: 'Baixo', min: 0, color: '#22c55e' },
      { label: 'Moderado', min: 17, color: '#eab308' },
      { label: 'Alto', min: 27, color: '#ef4444' },
    ],
  },
]

function getBand(
  value: number | null,
  thresholds: ScaleCardDef['thresholds']
): { label: string; color: string } {
  if (value === null) return { label: '—', color: '#64748b' }
  let matched = thresholds[0]
  for (const t of thresholds) {
    if (value >= t.min) matched = t
  }
  return { label: matched.label, color: matched.color }
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[15px] text-[#64748b]">
        Carregando dados…
      </div>
    )
  }

  if (!percepcao || !percepcao.enabled) {
    return (
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[20px]">💡</span>
            <h2 className="text-[20px] font-bold text-[#e2e8f0]">
              Bright Insights — Módulo de Saúde Mental
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-6 py-16 text-center">
          <span className="text-[40px]">🔒</span>
          <h3 className="mt-4 text-[18px] font-semibold text-[#e2e8f0]">
            Módulo não ativado
          </h3>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#94a3b8]">
            O Bright Insights ainda não está habilitado para esta empresa. Um
            administrador Bright Brains pode ativá-lo na aba de Configurações.
          </p>
        </div>
      </div>
    )
  }

  const { scaleAverages, assessmentCount } = percepcao

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">💡</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            Bright Insights — Módulo de Saúde Mental
          </h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Indicadores clínicos agregados — Escalas PHQ-9, GAD-7, ISI e MBI ·
          Dados 100% anônimos
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-[14px] border border-[rgba(197,225,85,0.1)] bg-[rgba(197,225,85,0.04)] px-3.5 py-2.5">
        <p className="text-[13px] leading-relaxed text-[#d4ec7e]">
          <strong>Sobre este módulo:</strong> apresenta as médias das escalas
          clínicas validadas internacionalmente, calculadas a partir das
          respostas dos colaboradores. Os dados são agregados — nenhum resultado
          individual é acessível.
        </p>
      </div>

      {/* Assessment count */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4 text-center">
        <div className="text-[22px]">📋</div>
        <div className="mt-1 font-mono text-[32px] font-bold leading-none tracking-tight text-[#c5e155]">
          {assessmentCount}
        </div>
        <div className="mt-1.5 text-[14px] text-[#94a3b8]">
          Avaliações Clínicas Neste Ciclo
        </div>
      </div>

      {/* Scale KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SCALE_CARDS.map((scale) => {
          const value = scaleAverages[scale.key]
          const band = getBand(value, scale.thresholds)
          return (
            <div
              key={scale.key}
              className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-5"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-[rgba(197,225,85,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#c5e155]">
                  {scale.label}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    color: band.color,
                    backgroundColor: `${band.color}20`,
                    border: `1px solid ${band.color}40`,
                  }}
                >
                  {band.label}
                </span>
              </div>
              <div className="mt-3 text-center">
                <div
                  className="font-mono text-[36px] font-bold leading-none tracking-tight"
                  style={{ color: band.color }}
                >
                  {value !== null ? value.toFixed(1) : '—'}
                </div>
                <div className="mt-2 text-[13px] font-medium text-[#e2e8f0]">
                  {scale.fullName}
                </div>
                <div className="mt-0.5 text-[12px] text-[#64748b]">
                  {scale.description}
                </div>
              </div>

              {/* Threshold legend */}
              <div className="mt-3 flex flex-wrap gap-1">
                {scale.thresholds.map((t) => (
                  <span
                    key={t.label}
                    className="rounded-md px-1.5 py-0.5 text-[10px]"
                    style={{
                      color: t.color,
                      backgroundColor: `${t.color}15`,
                    }}
                  >
                    {t.label} ≥{t.min}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scale reference */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
        <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
          Referência das Escalas
        </h3>
        <div className="space-y-3 text-[13px] leading-relaxed text-[#94a3b8]">
          <p>
            <strong className="text-[#e2e8f0]">PHQ-9</strong> — Patient Health
            Questionnaire: escala de 0–27 para rastreio de depressão. Pontos de
            corte: 5 (leve), 10 (moderado), 15 (moderadamente grave), 20
            (grave).
          </p>
          <p>
            <strong className="text-[#e2e8f0]">GAD-7</strong> — Generalized
            Anxiety Disorder: escala de 0–21 para rastreio de ansiedade. Pontos
            de corte: 5 (leve), 10 (moderado), 15 (grave).
          </p>
          <p>
            <strong className="text-[#e2e8f0]">ISI</strong> — Insomnia Severity
            Index: escala de 0–28 para avaliação de insônia. Pontos de corte: 8
            (subliminar), 15 (moderada), 22 (grave).
          </p>
          <p>
            <strong className="text-[#e2e8f0]">MBI</strong> — Maslach Burnout
            Inventory: escala para esgotamento profissional. Subescala de
            exaustão emocional: 0–54. Pontos de corte: 17 (moderado), 27
            (alto).
          </p>
        </div>
      </div>
    </div>
  )
}
