'use client'

import { marked } from 'marked'
import { useCallback, useMemo, useState } from 'react'

import { computeAllScores } from '../../../helpers/assessment/compute-scores'
import type { StepComponentProps } from '../assessment.interface'
import { SCALE_RANGES } from '../constants/scoring-ranges'
import { InfoBox, SectionTitle } from '../fields'
import { ScoreDisplay } from '../fields/ScoreDisplay'
import { StepNavigation } from '../StepNavigation'
import {
  GeneratingView,
  STAGE_LABELS,
  type StageContent,
} from './GeneratingView'

type Phase = 'review' | 'generating' | 'complete'

export function SummaryStep({ data, onPrev }: StepComponentProps) {
  const [phase, setPhase] = useState<Phase>('review')
  const [evaluationId, setEvaluationId] = useState<string | null>(null)
  const [stages, setStages] = useState<StageContent[]>([])
  const [progress, setProgress] = useState<{
    stage: number
    percent: number
    message: string
  } | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scores = computeAllScores(data)
  const activeScales = Object.entries(scores).filter(
    ([key]) => SCALE_RANGES[key] !== undefined
  )

  const streamReport = useCallback(
    async (evId: string) => {
      const res = await fetch('/api/assessment/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluationId: evId, formData: data, scores }),
      })
      if (!res.ok) throw new Error('Erro ao gerar relatório')
      if (!res.body) throw new Error('Streaming não suportado')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue
          try {
            const ev = JSON.parse(payload) as {
              type: string
              stage?: number
              progress?: number
              message?: string
              content?: string
            }
            if (ev.type === 'progress') {
              setProgress({
                stage: ev.stage ?? 0,
                percent: ev.progress ?? 0,
                message: ev.message ?? '',
              })
            } else if (ev.type === 'stage_complete') {
              setStages((prev) => [
                ...prev,
                { stage: ev.stage ?? 0, content: ev.content ?? '' },
              ])
            } else if (ev.type === 'error') {
              throw new Error(ev.message ?? 'Erro desconhecido')
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    },
    [data, scores]
  )

  const handleGenerate = useCallback(async () => {
    setError(null)
    setPhase('generating')
    setStages([])
    setProgress(null)

    try {
      const submitRes = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: data, scores }),
      })
      if (!submitRes.ok) {
        const errData = await submitRes.json().catch(() => ({}))
        throw new Error(
          (errData as { error?: string }).error || 'Erro ao salvar avaliação'
        )
      }
      const { evaluationId: evId } = (await submitRes.json()) as {
        evaluationId: string
      }
      setEvaluationId(evId)

      await streamReport(evId)
      setPhase('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setPhase('review')
    }
  }, [data, scores, streamReport])

  const handleExportPdf = useCallback(async () => {
    if (!evaluationId || stages.length < 3) return
    setIsExporting(true)
    setError(null)

    try {
      const reportMarkdown = stages.map((st) => st.content).join('\n\n---\n\n')
      const res = await fetch('/api/assessment/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId,
          formData: data,
          scores,
          reportMarkdown,
        }),
      })
      if (!res.ok) throw new Error('Erro ao gerar PDF')
      const { pdfUrl: url } = (await res.json()) as { pdfUrl: string }
      setPdfUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar PDF')
    } finally {
      setIsExporting(false)
    }
  }, [evaluationId, stages, data, scores])

  return (
    <div>
      <SectionTitle
        icon="📊"
        title="Resumo & Relatório"
        subtitle="Revisão dos resultados e geração de relatório com IA"
      />

      {phase === 'review' && (
        <>
          {activeScales.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Pontuações das Escalas
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {activeScales.map(([key, score]) => (
                  <ScoreDisplay
                    key={key}
                    score={score}
                    config={SCALE_RANGES[key]}
                  />
                ))}
              </div>
            </div>
          )}

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
            Ao clicar abaixo, os dados serão salvos e o relatório será gerado
            automaticamente pela IA (≈2 min).
          </InfoBox>

          {error && <InfoBox variant="warning">{error}</InfoBox>}

          <button
            type="button"
            onClick={() => void handleGenerate()}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 py-3.5 text-sm font-bold text-zinc-900 shadow-lg shadow-lime-400/20 transition-opacity hover:opacity-90"
          >
            Gerar Relatório de Apoio
          </button>
        </>
      )}

      {phase === 'generating' && (
        <GeneratingView stages={stages} progress={progress} error={error} />
      )}

      {phase === 'complete' && (
        <div className="space-y-4">
          {stages.map((st) => (
            <ReportStageDetails
              key={st.stage}
              stage={st}
              label={STAGE_LABELS[st.stage - 1]}
              defaultOpen={st.stage === stages.length}
            />
          ))}

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-300/80">
            <strong>Conformidade CFM nº 2.454/2026</strong> — Este relatório
            contém sugestões preliminares de IA classificada como Médio Risco
            (Art. 13, Anexo II). Todas as recomendações são não vinculantes e
            sujeitas à análise e decisão final do comitê médico responsável.
          </div>

          {error && <InfoBox variant="warning">{error}</InfoBox>}

          {!pdfUrl ? (
            <button
              type="button"
              onClick={() => void handleExportPdf()}
              disabled={isExporting}
              className="w-full rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 py-3 text-sm font-bold text-zinc-900 shadow-lg shadow-lime-400/20 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isExporting ? 'Gerando PDF...' : '📄 Exportar PDF'}
            </button>
          ) : (
            <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5 text-center">
              <p className="mb-2 text-sm font-semibold text-lime-400">
                PDF gerado com sucesso!
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-lime-400 px-6 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-lime-300"
              >
                Abrir PDF
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(pdfUrl)
                }}
                className="mt-2 block w-full text-xs text-zinc-500 underline hover:text-zinc-400"
              >
                Copiar link do PDF
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'review' && <StepNavigation onPrev={onPrev} onNext={null} />}
    </div>
  )
}

function ReportStageDetails({
  stage,
  label,
  defaultOpen,
}: {
  stage: StageContent
  label: string
  defaultOpen: boolean
}) {
  const html = useMemo(() => {
    marked.setOptions({ breaks: true, gfm: true })
    return marked.parse(stage.content) as string
  }, [stage.content])

  return (
    <details
      className="rounded-xl border border-zinc-700/50 bg-zinc-800/30"
      open={defaultOpen}
    >
      <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-zinc-200">
        {label}
      </summary>
      <div className="border-t border-zinc-700/30 px-5 py-4">
        <div
          className="prose prose-invert prose-sm max-w-none prose-headings:text-lime-400 prose-h2:text-base prose-h3:text-sm prose-strong:text-zinc-100 prose-li:text-zinc-300 text-zinc-300"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </details>
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
