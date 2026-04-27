// frontend/features/b2b-dashboard/components/tabs/B2BReportsTab.tsx

'use client'

import { marked } from 'marked'
import { useCallback, useMemo, useState } from 'react'

import { useBrightMonitorAnaliseIAMutation } from '../../hooks/useBrightMonitorAnaliseIAMutationHook'
import {
  useBrightMonitorPGRMutation,
  type PGRResult,
} from '../../hooks/useBrightMonitorPGRMutationHook'

interface PGRCardDef {
  slug: string
  title: string
  nr1Ref: string
  description: string
}

const PGR_CARDS: PGRCardDef[] = [
  {
    slug: 'inventario',
    title: 'Inventário de Riscos',
    nr1Ref: '§1.5.4',
    description:
      'Identificação e classificação de todos os perigos e fatores de risco ocupacionais, incluindo riscos psicossociais.',
  },
  {
    slug: 'plano',
    title: 'Plano de Ação 5W2H',
    nr1Ref: '§1.5.5',
    description:
      'Plano de controle de riscos com cronograma, responsáveis, recursos e indicadores de acompanhamento.',
  },
  {
    slug: 'psicossocial',
    title: 'Laudo Psicossocial',
    nr1Ref: '§1.5.3.2.1',
    description:
      'Avaliação detalhada dos 8 eixos psicossociais com diagnóstico organizacional e recomendações.',
  },
  {
    slug: 'pgr-completo',
    title: 'PGR Completo',
    nr1Ref: '§1.5',
    description:
      'Documento completo do Programa de Gerenciamento de Riscos com todas as seções obrigatórias da NR-1.',
  },
  {
    slug: 'anti-assedio',
    title: 'Política Anti-Assédio',
    nr1Ref: '§1.4.1.1',
    description:
      'Política de prevenção e combate ao assédio conforme NR-1 e Lei nº 14.457/2022.',
  },
  {
    slug: 'os-sst',
    title: 'Ordem de Serviço SST',
    nr1Ref: '§1.4.1 c',
    description:
      'Informações aos trabalhadores sobre riscos existentes e medidas de prevenção adotadas.',
  },
]

interface AnaliseCardDef {
  slug: string
  title: string
  description: string
}

const ANALISE_CARDS: AnaliseCardDef[] = [
  {
    slug: 'geral',
    title: 'Panorama Geral',
    description:
      'Visão executiva da saúde ocupacional com análise comparativa de domínios e recomendações estratégicas.',
  },
  {
    slug: 'psicossocial',
    title: 'Análise Psicossocial',
    description:
      'Análise aprofundada dos 8 eixos psicossociais com correlações e intervenções por eixo.',
  },
  {
    slug: 'criticos',
    title: 'Riscos Críticos',
    description:
      'Identificação e análise dos pontos que requerem atenção urgente, com ações recomendadas.',
  },
  {
    slug: 'priorizar',
    title: 'Priorização de Ações',
    description:
      'Ranking de ações por urgência × impacto com roadmap trimestral e KPIs sugeridos.',
  },
]

interface B2BReportsTabProps {
  companyId?: string | null
  cycleId?: string | null
}

function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false }) as string
    return raw
  }, [content])

  return (
    <div
      className="prose prose-invert max-w-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0a0f1a] p-5 text-[14px] leading-relaxed text-[#c8d0dc] [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-[16px] [&_h2]:font-bold [&_h2]:text-[#e2e8f0] [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-[#c5e155] [&_li]:ml-4 [&_li]:text-[13px] [&_p]:mb-2 [&_p]:text-[13px] [&_strong]:text-[#e2e8f0] [&_ul]:mb-2 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c5e155] border-t-transparent" />
      <span className="text-[13px] text-[#94a3b8]">Gerando com IA…</span>
    </div>
  )
}

export function B2BReportsTab({ companyId }: B2BReportsTabProps) {
  const [pgrResults, setPgrResults] = useState<Record<string, PGRResult>>({})
  const [analiseResults, setAnaliseResults] = useState<
    Record<string, string>
  >({})
  const [expandedPgr, setExpandedPgr] = useState<string | null>(null)
  const [expandedAnalise, setExpandedAnalise] = useState<string | null>(null)

  const pgrMutation = useBrightMonitorPGRMutation(companyId ?? null)
  const analiseMutation = useBrightMonitorAnaliseIAMutation(companyId ?? null)

  const handleGeneratePGR = useCallback(
    (slug: string) => {
      pgrMutation.mutate(slug, {
        onSuccess: (data) => {
          setPgrResults((prev) => ({ ...prev, [slug]: data }))
          setExpandedPgr(slug)
        },
      })
    },
    [pgrMutation]
  )

  const handleGenerateAnalise = useCallback(
    (slug: string) => {
      analiseMutation.mutate(slug, {
        onSuccess: (data) => {
          setAnaliseResults((prev) => ({ ...prev, [slug]: data.markdown }))
          setExpandedAnalise(slug)
        },
      })
    },
    [analiseMutation]
  )

  return (
    <div className="space-y-8">
      {/* ── Section 1: Documentos PGR ──────────────────────────────── */}
      <section>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[20px]">📋</span>
            <h2 className="text-[20px] font-bold text-[#e2e8f0]">
              Documentos PGR
            </h2>
          </div>
          <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
            Geração automática de documentos NR-1 com IA
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PGR_CARDS.map((card) => {
            const isGenerating =
              pgrMutation.isPending && pgrMutation.variables === card.slug
            const result = pgrResults[card.slug]
            const isExpanded = expandedPgr === card.slug

            return (
              <div
                key={card.slug}
                className="flex flex-col rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-[rgba(197,225,85,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#c5e155]">
                    {card.nr1Ref}
                  </span>
                  <span className="rounded-md bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                    PDF
                  </span>
                </div>
                <h3 className="mt-3 text-[17px] font-semibold text-[#e2e8f0]">
                  {card.title}
                </h3>
                <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-[#64748b]">
                  {card.description}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleGeneratePGR(card.slug)}
                    disabled={isGenerating}
                    className="rounded-lg bg-[rgba(197,225,85,0.15)] px-4 py-1.5 text-[14px] font-semibold text-[#c5e155] transition-colors hover:bg-[rgba(197,225,85,0.25)] disabled:opacity-50"
                  >
                    {isGenerating ? 'Gerando…' : 'Gerar'}
                  </button>
                  {result?.pdfUrl && (
                    <a
                      href={result.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[rgba(255,255,255,0.06)] px-3 py-1.5 text-[13px] text-[#94a3b8] transition-colors hover:border-[rgba(197,225,85,0.3)] hover:text-[#c5e155]"
                    >
                      ↓ PDF
                    </a>
                  )}
                  {result && (
                    <button
                      onClick={() =>
                        setExpandedPgr(isExpanded ? null : card.slug)
                      }
                      className="ml-auto text-[13px] text-[#64748b] hover:text-[#94a3b8]"
                    >
                      {isExpanded ? 'Recolher' : 'Ver texto'}
                    </button>
                  )}
                </div>

                {isGenerating && (
                  <div className="mt-3">
                    <LoadingSpinner />
                  </div>
                )}

                {pgrMutation.isError &&
                  pgrMutation.variables === card.slug && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[13px] text-red-400">
                        {pgrMutation.error.message}
                      </span>
                      <button
                        onClick={() => handleGeneratePGR(card.slug)}
                        className="text-[13px] text-[#c5e155] underline"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                {result?.generatedAt && (
                  <p className="mt-2 text-[11px] text-[#475569]">
                    Gerado em{' '}
                    {new Date(result.generatedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Expanded PGR markdown preview */}
        {expandedPgr && pgrResults[expandedPgr]?.markdown && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#e2e8f0]">
                {PGR_CARDS.find((c) => c.slug === expandedPgr)?.title}
              </h3>
              <button
                onClick={() => setExpandedPgr(null)}
                className="text-[13px] text-[#64748b] hover:text-[#94a3b8]"
              >
                ✕ Fechar
              </button>
            </div>
            <MarkdownPreview content={pgrResults[expandedPgr].markdown} />
          </div>
        )}
      </section>

      {/* ── Section 2: Análise IA ──────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[20px]">🤖</span>
            <h2 className="text-[20px] font-bold text-[#e2e8f0]">
              Análise IA
            </h2>
          </div>
          <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
            Insights e recomendações gerados por inteligência artificial
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ANALISE_CARDS.map((card) => {
            const isGenerating =
              analiseMutation.isPending &&
              analiseMutation.variables === card.slug
            const result = analiseResults[card.slug]
            const isExpanded = expandedAnalise === card.slug

            return (
              <div
                key={card.slug}
                className="flex flex-col rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-5"
              >
                <h3 className="text-[17px] font-semibold text-[#e2e8f0]">
                  {card.title}
                </h3>
                <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-[#64748b]">
                  {card.description}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateAnalise(card.slug)}
                    disabled={isGenerating}
                    className="rounded-lg bg-[rgba(96,165,250,0.15)] px-4 py-1.5 text-[14px] font-semibold text-[#60a5fa] transition-colors hover:bg-[rgba(96,165,250,0.25)] disabled:opacity-50"
                  >
                    {isGenerating ? 'Analisando…' : 'Analisar'}
                  </button>
                  {result && (
                    <button
                      onClick={() =>
                        setExpandedAnalise(isExpanded ? null : card.slug)
                      }
                      className="ml-auto text-[13px] text-[#64748b] hover:text-[#94a3b8]"
                    >
                      {isExpanded ? 'Recolher' : 'Ver análise'}
                    </button>
                  )}
                </div>

                {isGenerating && (
                  <div className="mt-3">
                    <LoadingSpinner />
                  </div>
                )}

                {analiseMutation.isError &&
                  analiseMutation.variables === card.slug && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[13px] text-red-400">
                        {analiseMutation.error.message}
                      </span>
                      <button
                        onClick={() => handleGenerateAnalise(card.slug)}
                        className="text-[13px] text-[#60a5fa] underline"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}
              </div>
            )
          })}
        </div>

        {/* Expanded analysis markdown preview */}
        {expandedAnalise && analiseResults[expandedAnalise] && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#e2e8f0]">
                {ANALISE_CARDS.find((c) => c.slug === expandedAnalise)?.title}
              </h3>
              <button
                onClick={() => setExpandedAnalise(null)}
                className="text-[13px] text-[#64748b] hover:text-[#94a3b8]"
              >
                ✕ Fechar
              </button>
            </div>
            <MarkdownPreview content={analiseResults[expandedAnalise]} />
          </div>
        )}
      </section>
    </div>
  )
}
