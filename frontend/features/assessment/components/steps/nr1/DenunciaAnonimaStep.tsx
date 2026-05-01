// frontend/features/assessment/components/steps/nr1/DenunciaAnonimaStep.tsx
'use client'

import type { StepComponentProps } from '../../assessment.interface'
import { SectionTitle, Textarea } from '../../fields'
import { StepNavigation } from '../../StepNavigation'

const MAX_LENGTH = 2000

export function DenunciaAnonimaStep({
  data,
  setData,
  onPrev,
  onNext,
}: StepComponentProps) {
  const value = (data.anonymous_complaint_description as string) ?? ''

  const update = (next: string) => {
    setData({
      ...data,
      anonymous_complaint_description: next.slice(0, MAX_LENGTH),
    })
  }

  return (
    <div>
      <SectionTitle
        icon="🔒"
        title="Denúncia ou Relato Anônimo"
        subtitle="Espaço opcional para você relatar, de forma anônima, qualquer denúncia, preocupação ou risco que queira comunicar à empresa."
      />

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-4">
        <div className="flex items-start gap-3">
          <span className="text-base">🔒</span>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              Este campo é 100% anônimo
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              O administrador da sua empresa receberá apenas o texto que você
              escrever aqui, sem o seu nome, e-mail ou qualquer informação que
              identifique você. Este canal não substitui o canal de denúncias
              oficial da empresa, mas serve para que riscos e preocupações
              cheguem à liderança de SST.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Textarea
          label="Descreva sua denúncia ou preocupação (opcional)"
          value={value}
          onChange={update}
          placeholder="Descreva aqui qualquer situação, risco ou denúncia que queira reportar de forma anônima."
          rows={6}
          hint={`${value.length}/${MAX_LENGTH} caracteres`}
        />
      </div>

      <StepNavigation onPrev={onPrev} onNext={onNext} />
    </div>
  )
}
