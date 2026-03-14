'use client'

import { useState } from 'react'
import { cn } from '~/shared/utils/cn'
import type { ReportHistoryEntry } from '../portal.interface'

function parseProcessingStatus(status: string | null | undefined) {
  if (!status || !status.startsWith('processing')) return null

  if (status.startsWith('processing_dispatching_')) {
    return {
      phase: 'fixed' as const,
      current: 0,
      total: 0,
      label: 'Inicializando processamento',
    }
  }

  if (status.startsWith('processing_claimed_')) {
    return {
      phase: 'fixed' as const,
      current: 0,
      total: 0,
      label: 'Alocando worker de processamento',
    }
  }

  if (status.startsWith('processing_report_')) {
    return {
      phase: 'fixed' as const,
      current: 0,
      total: 0,
      label: 'Iniciando geração do relatório',
    }
  }

  const extractMatch = status.match(/^processing_extract_(\d+)_of_(\d+)$/)
  if (extractMatch) {
    return {
      phase: 'extract' as const,
      current: parseInt(extractMatch[1]),
      total: parseInt(extractMatch[2]),
      label: `Extraindo documento ${extractMatch[1]} de ${extractMatch[2]}`,
    }
  }

  const stageMatch = status.match(/^processing_stage_(\d+)_of_(\d+)$/)
  if (stageMatch) {
    const stageNames: Record<string, string> = {
      '1': 'Análise clínica e diagnósticos',
      '2': 'Terapêutica e neuromodulação',
      '3': 'Monitoramento e conformidade',
    }
    return {
      phase: 'stage' as const,
      current: parseInt(stageMatch[1]),
      total: parseInt(stageMatch[2]),
      label:
        stageNames[stageMatch[1]] ??
        `Gerando seção ${stageMatch[1]} de ${stageMatch[2]}`,
    }
  }

  const fixedSteps: Record<string, string> = {
    processing: 'Iniciando processamento',
    processing_report: 'Iniciando geração do relatório',
    processing_pdf: 'Gerando PDF do relatório',
    processing_upload: 'Salvando PDF no storage',
    processing_notify: 'Notificando equipe',
  }

  return {
    phase: 'fixed' as const,
    current: 0,
    total: 0,
    label: fixedSteps[status] ?? 'Processando...',
  }
}

interface MarkdownSection {
  title: string | null
  content: string
}

function splitIntoSections(md: string): MarkdownSection[] {
  const lines = md.split('\n')
  const sections: MarkdownSection[] = []
  let currentTitle: string | null = null
  let currentLines: string[] = []

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/)
    if (h2Match) {
      if (currentLines.length > 0 || currentTitle !== null) {
        sections.push({
          title: currentTitle,
          content: currentLines.join('\n').trim(),
        })
      }
      currentTitle = h2Match[1]
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }

  if (currentLines.length > 0 || currentTitle !== null) {
    sections.push({
      title: currentTitle,
      content: currentLines.join('\n').trim(),
    })
  }

  return sections
}

function sectionContentToHtml(md: string): string {
  let html = md
    .replace(
      /^#### (.+)$/gm,
      '<h4 class="text-[0.9375rem] font-semibold text-[#5ec4b6] mt-5 mb-2">$1</h4>'
    )
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-base font-bold text-[#00c9b1] mt-6 mb-2">$1</h3>'
    )
    .replace(
      /^# (.+)$/gm,
      '<h1 class="text-2xl font-bold text-white mb-3">$1</h1>'
    )
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-[#e0f0ff]">$1</strong>'
    )
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '')
    .replace(/\n\n/g, '<br/><br/>')

  html = html.replace(
    /(<li>[\s\S]*?<\/li>(?:\s*<li>[\s\S]*?<\/li>)*)/g,
    '<ul class="ml-5 my-3 space-y-1.5 list-disc marker:text-[#00c9b1]">$1</ul>'
  )

  return html
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ReportPreviewComponentProps {
  markdown: string | null
  pdfUrl: string | null
  reportHistory: ReportHistoryEntry[]
  isRegenerating?: boolean
  processingStatus?: string | null
}

export function ReportPreviewComponent({
  markdown,
  pdfUrl,
  reportHistory,
  isRegenerating = false,
  processingStatus = null,
}: ReportPreviewComponentProps) {
  const totalVersions = reportHistory.length + (markdown ? 1 : 0)
  const [viewingVersion, setViewingVersion] = useState<number | null>(null)

  const viewingHistory =
    viewingVersion !== null ? reportHistory[viewingVersion] : null
  const displayMarkdown = viewingHistory?.report_markdown ?? markdown
  const displayPdfUrl = viewingHistory?.report_pdf_url ?? pdfUrl
  const isCurrentVersion = viewingVersion === null
  const parsed = parseProcessingStatus(processingStatus)

  return (
    <div>
      {/* Regenerating banner */}
      {isRegenerating && (
        <div className="mb-4 rounded-lg border border-[rgba(240,160,48,0.3)] bg-[rgba(240,160,48,0.08)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#f0a030]" />
            <div>
              <p className="text-sm font-medium text-[#f0a030]">
                {parsed?.label ?? 'Relatório sendo processado...'}
              </p>
              <p className="text-xs text-[#5a7fa0]">
                Este processo roda em segundo plano e pode demorar alguns
                minutos.
              </p>
            </div>
          </div>

          {parsed && parsed.total > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-[#5a7fa0]">
                  {parsed.phase === 'extract'
                    ? `Documento ${parsed.current} de ${parsed.total}`
                    : `Etapa ${parsed.current} de ${parsed.total}`}
                </span>
                <span className="font-mono text-[#f0a030]">
                  {Math.round((parsed.current / parsed.total) * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#1a3a5c]">
                <div
                  className="h-full rounded-full bg-[#f0a030] transition-all duration-500"
                  style={{
                    width: `${Math.round((parsed.current / parsed.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Version selector */}
      {totalVersions > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[1.5px] text-[#3a5a75]">
            Versões:
          </span>
          {reportHistory.map((entry, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setViewingVersion(viewingVersion === i ? null : i)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                viewingVersion === i
                  ? 'bg-[rgba(240,160,48,0.15)] text-[#f0a030]'
                  : 'bg-[#0f2240] text-[#5a7fa0] hover:text-[#cce6f7]'
              )}
            >
              v{i + 1} — {formatDate(entry.generated_at)}
            </button>
          ))}
          {markdown && (
            <button
              type="button"
              onClick={() => setViewingVersion(null)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                isCurrentVersion
                  ? 'bg-[rgba(0,201,177,0.12)] text-[#00c9b1]'
                  : 'bg-[#0f2240] text-[#5a7fa0] hover:text-[#cce6f7]'
              )}
            >
              v{totalVersions} (atual)
            </button>
          )}
        </div>
      )}

      {/* Viewing old version badge */}
      {viewingHistory && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[rgba(240,160,48,0.3)] bg-[rgba(240,160,48,0.06)] px-3 py-2">
          <span className="text-xs text-[#f0a030]">
            Visualizando versão {(viewingVersion ?? 0) + 1} de{' '}
            {formatDate(viewingHistory.generated_at)}
          </span>
          <button
            type="button"
            onClick={() => setViewingVersion(null)}
            className="text-xs font-medium text-[#5a7fa0] underline transition-colors hover:text-[#cce6f7]"
          >
            Ver atual
          </button>
        </div>
      )}

      {/* Report content */}
      {!displayMarkdown && !isRegenerating ? (
        <p className="text-sm text-[#5a7fa0]">Relatório ainda não gerado.</p>
      ) : displayMarkdown ? (
        <>
          {displayPdfUrl && (
            <a
              href={displayPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#00c9b1] bg-transparent px-4 py-2.5 text-sm font-medium text-[#00c9b1] transition-colors hover:bg-[rgba(0,201,177,0.1)]"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Baixar PDF{!isCurrentVersion ? ` (v${(viewingVersion ?? 0) + 1})` : ''}
            </a>
          )}
          <div className="space-y-3">
            {splitIntoSections(displayMarkdown).map((section, i) => {
              const isIntro = section.title === null
              const isEven = i % 2 === 0

              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg px-6 py-5 text-[0.9375rem] leading-[1.8] text-[#b0c8de]',
                    isIntro
                      ? 'border-l-[3px] border-l-[#00c9b1] bg-[#0f2240]'
                      : isEven
                        ? 'bg-[#0b1a30]'
                        : 'bg-[#0f2240]'
                  )}
                >
                  {section.title && (
                    <h2 className="mb-4 text-xl font-bold text-[#e0f0ff]">
                      {section.title}
                    </h2>
                  )}
                  {section.content && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sectionContentToHtml(section.content),
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
