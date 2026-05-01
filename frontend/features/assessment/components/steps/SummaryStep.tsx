'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { computeAllScores } from '../../helpers/compute-scores'
import { clearFormData } from '../../services/localStorage'
import type { StepComponentProps } from '../assessment.interface'
import { InfoBox, SectionTitle } from '../fields'
import { StepNavigation } from '../StepNavigation'

type Phase = 'review' | 'submitting' | 'submitted'

interface LaudoStatus {
  status: string
  laudo_pdf_url?: string | null
}

const LAUDO_POLL_INTERVAL_MS = 5_000
const LAUDO_TIMEOUT_MS = 4 * 60 * 1000

function useLaudoPolling(evaluationId: string | null, enabled: boolean) {
  const [laudo, setLaudo] = useState<LaudoStatus | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !evaluationId) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/assessment/laudo-status?id=${evaluationId}`)
        if (!res.ok) return
        const data = (await res.json()) as LaudoStatus
        setLaudo(data)
        if (data.laudo_pdf_url || data.status === 'error') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
      } catch {
        // silently ignore polling errors
      }
    }

    void poll()
    intervalRef.current = setInterval(() => void poll(), LAUDO_POLL_INTERVAL_MS)
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setTimedOut(true)
    }, LAUDO_TIMEOUT_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [evaluationId, enabled])

  return { laudo, timedOut }
}

const PROFILE_LABELS: Record<string, string> = {
  adulto: 'Adulto (Psiquiatria Geral)',
  infantil: 'Infantil / Adolescente',
  neuro: 'Neurológico',
  executivo: 'Executivo',
  longevidade: 'Longevidade',
}

const B2B_SCALE_LABELS: { key: string; label: string }[] = [
  { key: 'srq20', label: 'SRQ-20 — Saúde Mental Geral' },
  { key: 'phq9', label: 'PHQ-9 — Depressão' },
  { key: 'gad7', label: 'GAD-7 — Ansiedade' },
  { key: 'pss10', label: 'PSS-10 — Estresse' },
  { key: 'mbi', label: 'MBI — Burnout' },
  { key: 'isi', label: 'ISI — Qualidade do Sono' },
  { key: 'aep_total', label: 'AEP — Fatores Psicossociais' },
]

export function SummaryStep({
  data,
  onPrev,
  companyContext,
}: StepComponentProps) {
  const [phase, setPhase] = useState<Phase>('review')
  const [error, setError] = useState<string | null>(null)
  const [evaluationId, setEvaluationId] = useState<string | null>(null)
  const isCorporate = !!companyContext?.company_id
  const { laudo, timedOut } = useLaudoPolling(evaluationId, isCorporate && phase === 'submitted')

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
          const mime = header?.match(/:(.*?);/)?.[1] || 'application/pdf'
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
          ...(companyContext?.company_id
            ? { company_id: companyContext.company_id }
            : {}),
          ...(companyContext?.department
            ? { employee_department: companyContext.department }
            : {}),
          ...(companyContext?.cycle_id
            ? { cycle_id: companyContext.cycle_id }
            : {}),
          ...(companyContext?.code_id
            ? { code_id: companyContext.code_id }
            : {}),
          b2b_anonymized_consent: data.b2b_anonymized_consent === true,
          b2c_consent: data.b2c_consent === true,
          b2c_contact_consent: data.b2c_contact_consent === true,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          (errData as { error?: string }).error || 'Erro ao enviar avaliação'
        )
      }

      const resData = (await res.json().catch(() => ({}))) as {
        evaluationId?: string
      }
      if (resData.evaluationId) setEvaluationId(resData.evaluationId)

      clearFormData()
      setPhase('submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setPhase('review')
    }
  }, [data, scores, companyContext])

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
            {/* Personal data — always shown */}
            <SummaryCard
              title="Dados Pessoais"
              items={[
                `Nome: ${data.nome || '—'}`,
                `Nascimento: ${data.nascimento || '—'}`,
                data.email ? `E-mail: ${data.email}` : null,
                data.sexo ? `Sexo: ${data.sexo}` : null,
                isCorporate && companyContext?.department
                  ? `Setor: ${companyContext.department}`
                  : null,
              ].filter(Boolean) as string[]}
            />

            {isCorporate ? (
              /* B2B: show scale scores */
              <B2BScalesSummary scores={scores} />
            ) : (
              /* B2C: show clinical profile data */
              <>
                {(data.publico || data.queixaPrincipal) && (
                  <SummaryCard
                    title="Perfil Clínico"
                    items={[
                      data.publico
                        ? `Perfil: ${PROFILE_LABELS[data.publico] ?? data.publico}`
                        : null,
                      data.queixaPrincipal
                        ? `Queixa: ${data.queixaPrincipal}`
                        : null,
                      data.tempoSintomas
                        ? `Tempo dos sintomas: ${data.tempoSintomas}`
                        : null,
                    ].filter(Boolean) as string[]}
                  />
                )}
                {data.sintomasAtuais.length > 0 && (
                  <SummaryCard
                    title="Sintomas Relatados"
                    items={[`${data.sintomasAtuais.length} sintoma(s) selecionado(s)`, ...data.sintomasAtuais.slice(0, 4)]}
                  />
                )}
                <B2CScalesSummary scores={scores} />
              </>
            )}

            {data.medicamentos.length > 0 && (
              <SummaryCard
                title="Medicamentos"
                items={data.medicamentos.map(
                  (m) => `${m.nome} ${m.dose} — ${m.tempo}`
                )}
              />
            )}

            {isCorporate && data.canal_percepcao?.descricao?.trim() && (
              <SummaryCard
                title="Canal de Percepção"
                items={[
                  data.canal_percepcao.urgencia
                    ? `Urgência: ${data.canal_percepcao.urgencia}`
                    : null,
                  `Relato: ${data.canal_percepcao.descricao.slice(0, 100)}${data.canal_percepcao.descricao.length > 100 ? '…' : ''}`,
                ].filter(Boolean) as string[]}
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
          <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5 text-center sm:p-8">
            <div className="mb-4 text-4xl">✅</div>
            <h3 className="mb-2 text-lg font-bold text-lime-400">
              Avaliação Enviada com Sucesso
            </h3>
            <p className="text-sm text-zinc-400">
              {isCorporate
                ? 'Obrigado por preencher a avaliação corporativa. Seus dados foram recebidos com segurança e confidencialidade.'
                : 'Obrigado por preencher a avaliação. Seus dados foram recebidos com segurança.'}
            </p>
            {evaluationId && (
              <p className="mt-2 font-mono text-xs text-zinc-500">
                ID: {evaluationId}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5 text-center">
            <p className="mb-2 text-sm font-medium text-zinc-300">
              O que acontece agora?
            </p>
            {isCorporate ? (
              <div className="mx-auto max-w-md space-y-3 text-left">
                <ol className="space-y-2 text-xs text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                      1
                    </span>
                    A IA está gerando seu Laudo Individual BrightMonitor
                    (pode levar 1-3 min)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                      2
                    </span>
                    Seus dados individuais são confidenciais — a empresa recebe
                    apenas indicadores agregados
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                      3
                    </span>
                    O RH poderá entrar em contato para agendar acompanhamento,
                    se necessário
                  </li>
                </ol>

                {/* Laudo PDF polling status */}
                <div className="mt-4 rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
                  {laudo?.laudo_pdf_url ? (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-lime-400">
                          Laudo Individual Pronto
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          Seu relatório foi gerado com sucesso
                        </p>
                      </div>
                      <a
                        href={laudo.laudo_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-lime-400/15 px-3 py-1.5 text-xs font-semibold text-lime-400 transition-colors hover:bg-lime-400/25"
                      >
                        Baixar PDF
                      </a>
                    </div>
                  ) : laudo?.status === 'error' ? (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="text-xs font-medium text-amber-400">
                          Erro ao gerar laudo
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          Nossa equipe foi notificada e entrará em contato
                        </p>
                      </div>
                    </div>
                  ) : timedOut ? (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⏳</span>
                      <div>
                        <p className="text-xs font-medium text-zinc-300">
                          Laudo ainda em processamento
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          Está demorando mais que o esperado. Você receberá o laudo por e-mail em breve.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-lime-400" />
                      <div>
                        <p className="text-xs font-medium text-zinc-300">
                          Gerando Laudo Individual…
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          Aguarde enquanto processamos sua avaliação (1–2 min)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <ol className="mx-auto max-w-md space-y-2 text-left text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                    1
                  </span>
                  O sistema está gerando seu relatório com inteligência
                  artificial
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
            )}

            {evaluationId && !isCorporate && (
              <a
                href={`/pt-BR/portal/${evaluationId}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/10 px-4 py-2.5 text-sm font-medium text-lime-400 transition-colors hover:bg-lime-400/20"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                Acompanhar no Portal
              </a>
            )}
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

function B2BScalesSummary({ scores }: { scores: Record<string, number> }) {
  const filled = B2B_SCALE_LABELS.filter(({ key }) => scores[key] !== undefined)
  if (filled.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-4 py-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Escalas Preenchidas ({filled.length}/{B2B_SCALE_LABELS.length})
      </h4>
      <div className="space-y-1.5">
        {filled.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">{label}</span>
            <svg
              className="h-4 w-4 shrink-0 text-lime-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}

function B2CScalesSummary({ scores }: { scores: Record<string, number> }) {
  const b2cKeys = [
    { key: 'phq9', label: 'PHQ-9 (Depressão)', max: 27 },
    { key: 'gad7', label: 'GAD-7 (Ansiedade)', max: 21 },
    { key: 'isi', label: 'ISI (Sono)', max: 28 },
    { key: 'mbi', label: 'MBI (Burnout)', max: 132 },
    { key: 'pss10', label: 'PSS-10 (Estresse)', max: 40 },
  ]
  const filled = b2cKeys.filter(({ key }) => scores[key] !== undefined)
  if (filled.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-4 py-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Escalas Clínicas ({filled.length} respondida{filled.length !== 1 ? 's' : ''})
      </h4>
      <div className="space-y-1.5">
        {filled.map(({ key, label, max }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">{label}</span>
            <span className="shrink-0 font-mono text-xs font-medium text-zinc-200">
              {scores[key]}/{max}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
