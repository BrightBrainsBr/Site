// frontend/components/assessment/steps/WelcomeStep.tsx
'use client'

import type { StepComponentProps } from '../assessment.interface'

const FEATURES = [
  { icon: '📊', title: '16+ Escalas', desc: 'Validadas cientificamente' },
  { icon: '🤖', title: 'IA de Apoio', desc: 'Sugestões ao comitê médico' },
  { icon: '📄', title: 'Relatório PDF', desc: 'Recomendações preliminares' },
  { icon: '🔒', title: 'LGPD + CFM', desc: 'Conformidade regulatória' },
]

export function WelcomeStep({ onNext }: StepComponentProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.svg"
        alt="Bright Brains"
        className="mx-auto mb-6 h-11 w-auto"
      />

      <h1 className="text-2xl font-bold text-zinc-100">Bright Precision</h1>

      <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-lime-400">
        Avaliação Inteligente. Cuidado Personalizado.
      </p>

      <p className="mt-1 text-sm text-zinc-500">
        by Bright Brains · Instituto da Mente
      </p>

      <div className="mt-6 rounded-xl border border-lime-400/20 bg-lime-400/[0.04] p-5 text-left text-sm leading-relaxed text-zinc-300">
        <p>
          O <span className="font-bold text-lime-400">Bright Precision</span> é
          uma{' '}
          <span className="font-bold text-lime-400">
            IA de Apoio à Decisão Clínica
          </span>{' '}
          que analisa dados clínicos e gera{' '}
          <span className="font-bold text-lime-400">
            Sugestões Preliminares ao Comitê Médico Interdisciplinar
          </span>
          . Todos os outputs são{' '}
          <span className="font-bold text-lime-400">
            recomendações não vinculantes
          </span>
          , sujeitas à análise, validação e decisão final da equipe médica
          responsável.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5 text-left text-sm leading-relaxed text-zinc-300">
        <p className="mb-2 font-semibold text-amber-300">
          ⚖️ Conformidade — CFM nº 2.454/2026
        </p>
        <p>
          Sistema classificado como{' '}
          <span className="font-semibold text-amber-300">Médio Risco</span>{' '}
          (Art. 13, Anexo II), operando como{' '}
          <span className="font-semibold text-amber-300">
            ferramenta de apoio
          </span>{' '}
          (Art. 4º, I) com{' '}
          <span className="font-semibold text-amber-300">
            supervisão médica ativa
          </span>{' '}
          (Art. 18). O médico pode aceitar ou rejeitar qualquer sugestão.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <span className="text-2xl">{f.icon}</span>
            <p className="mt-2 text-sm font-semibold text-zinc-100">
              {f.title}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{f.desc}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext ?? undefined}
        disabled={!onNext}
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-lime-400 to-green-500 px-8 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-lime-400/20 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Iniciar Avaliação
      </button>
    </div>
  )
}
