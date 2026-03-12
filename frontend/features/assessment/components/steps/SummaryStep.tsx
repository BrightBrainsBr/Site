'use client'

import { useCallback, useState } from 'react'

import { computeAllScores } from '../../helpers/compute-scores'
import { clearFormData } from '../../services/localStorage'
import type { StepComponentProps } from '../assessment.interface'
import { InfoBox, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

type Phase = 'review' | 'submitting' | 'submitted'

export function SummaryStep({ data, onPrev }: StepComponentProps) {
  const [phase, setPhase] = useState<Phase>('review')
  const [error, setError] = useState<string | null>(null)

  const scores = computeAllScores(data)

  const handleSubmit = useCallback(async () => {
    setError(null)
    setPhase('submitting')

    try {
      const uploadedFiles: { name: string; url: string; type: string }[] = []

      for (const files of Object.values(data.uploads)) {
        for (const f of files as {
          name: string
          size: number
          data?: string
        }[]) {
          if (!f.data) continue

          const [header, b64] = f.data.split(',')
          const mime =
            header?.match(/:(.*?);/)?.[1] || 'application/pdf'
          const bytes = atob(b64)
          const buf = new Uint8Array(bytes.length)
          for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
          const blob = new Blob([buf], { type: mime })

          const params = new URLSearchParams({
            fileName: f.name,
            fileSize: String(blob.size),
            contentType: blob.type || 'application/pdf',
          })
          const urlRes = await fetch(
            `/api/assessment/upload?${params.toString()}`
          )
          if (!urlRes.ok) {
            throw new Error(`Erro ao preparar upload: ${f.name}`)
          }

          const { signedUrl, token, publicUrl } = (await urlRes.json()) as {
            signedUrl: string
            token: string
            publicUrl: string
          }

          const putRes = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': blob.type || 'application/pdf',
              'x-upsert': 'false',
            },
            body: blob,
          })

          if (!putRes.ok) {
            throw new Error(`Erro ao enviar arquivo: ${f.name}`)
          }

          void token
          uploadedFiles.push({
            name: f.name,
            url: publicUrl,
            type: blob.type || 'application/pdf',
          })
        }
      }

      const { uploads: _uploads, ...formDataWithoutUploads } = data

      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: formDataWithoutUploads,
          scores,
          uploads: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          (errData as { error?: string }).error || 'Erro ao enviar avaliação'
        )
      }

      clearFormData()
      setPhase('submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setPhase('review')
    }
  }, [data, scores])

  return (
    <div>
      <SectionTitle
        icon="📊"
        title="Resumo & Envio"
        subtitle="Revise seus dados e envie a avaliação"
      />

      {phase === 'review' && (
        <>
          <div className="mb-6 space-y-3">
            <SummaryCard
              title="Paciente"
              items={[
                `Nome: ${data.nome || '—'}`,
                `Nascimento: ${data.nascimento || '—'}`,
                `Perfil: ${data.publico || '—'}`,
              ]}
            />
            <SummaryCard
              title="Queixa Principal"
              items={[data.queixaPrincipal || '(não informado)']}
            />
            {data.medicamentos.length > 0 && (
              <SummaryCard
                title="Medicamentos"
                items={data.medicamentos.map(
                  (m) => `${m.nome} ${m.dose} — ${m.tempo}`
                )}
              />
            )}
          </div>

          <InfoBox variant="info">
            Ao clicar abaixo, seus dados serão enviados com segurança. O
            relatório será processado e enviado diretamente à clínica para
            análise pelo comitê médico.
          </InfoBox>

          {error && <InfoBox variant="warning">{error}</InfoBox>}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 py-3.5 text-sm font-bold text-zinc-900 shadow-lg shadow-lime-400/20 transition-opacity hover:opacity-90"
          >
            Enviar Avaliação
          </button>
        </>
      )}

      {phase === 'submitting' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-600 border-t-lime-400" />
          <p className="text-sm text-zinc-400">Enviando sua avaliação...</p>
        </div>
      )}

      {phase === 'submitted' && (
        <div className="space-y-4 py-6">
          <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-8 text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h3 className="mb-2 text-lg font-bold text-lime-400">
              Avaliação Enviada com Sucesso
            </h3>
            <p className="text-sm text-zinc-400">
              Obrigado por preencher a avaliação. Seus dados foram recebidos com
              segurança.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5 text-center">
            <p className="mb-2 text-sm font-medium text-zinc-300">
              O que acontece agora?
            </p>
            <ol className="mx-auto max-w-md space-y-2 text-left text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                  1
                </span>
                O sistema está gerando seu relatório com inteligência artificial
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                  2
                </span>
                O relatório será enviado automaticamente para a clínica
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                  3
                </span>
                O Comitê Médico analisará e validará as recomendações
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                  4
                </span>
                A clínica entrará em contato com você
              </li>
            </ol>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-300/80">
            <strong>Conformidade CFM nº 2.454/2026</strong> — O relatório gerado
            contém sugestões preliminares de IA classificada como Médio Risco
            (Art. 13, Anexo II). Todas as recomendações são não vinculantes e
            sujeitas à análise e decisão final do comitê médico responsável.
          </div>
        </div>
      )}

      {phase === 'review' && <StepNavigation onPrev={onPrev} onNext={null} />}
    </div>
  )
}

function SummaryCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-4 py-3">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h4>
      {items.map((item, i) => (
        <p key={i} className="text-sm text-zinc-300">
          {item}
        </p>
      ))}
    </div>
  )
}
