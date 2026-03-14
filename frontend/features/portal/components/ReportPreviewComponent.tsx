'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '~/shared/utils/cn'
import type { ProcessingLogEntry, ReportHistoryEntry } from '../portal.interface'

type PipelineStep = {
  id: string
  label: string
  state: 'pending' | 'active' | 'done'
  detail?: string
}

function buildPipelineSteps(
  status: string | null | undefined
): PipelineStep[] | null {
  if (!status || !status.startsWith('processing')) return null

  const steps: PipelineStep[] = [
    { id: 'init', label: 'Inicializando', state: 'pending' },
    { id: 'extract', label: 'Extraindo documentos', state: 'pending' },
    { id: 'report', label: 'Gerando relatório (IA)', state: 'pending' },
    { id: 'pdf', label: 'Montando PDF', state: 'pending' },
    { id: 'upload', label: 'Salvando', state: 'pending' },
    { id: 'notify', label: 'Notificando', state: 'pending' },
  ]

  function markUpTo(targetId: string, detail?: string) {
    let found = false
    for (const s of steps) {
      if (s.id === targetId) {
        s.state = 'active'
        if (detail) s.detail = detail
        found = true
      } else if (!found) {
        s.state = 'done'
      }
    }
  }

  if (
    status.startsWith('processing_dispatching_') ||
    status.startsWith('processing_claimed_') ||
    status === 'processing'
  ) {
    markUpTo('init')
    return steps
  }

  if (status.startsWith('processing_report_')) {
    markUpTo('extract', 'Conectando com IA...')
    return steps
  }

  const extractMatch = status.match(/^processing_extract_(\d+)_of_(\d+)$/)
  if (extractMatch) {
    markUpTo('extract', `Documento ${extractMatch[1]} de ${extractMatch[2]}`)
    return steps
  }

  const stageMatch = status.match(/^processing_stage_(\d+)_of_(\d+)$/)
  if (stageMatch) {
    const stageNum = stageMatch[1]
    const detail =
      stageNum === '1'
        ? 'Gerando seções 1-5 (análise clínica)…'
        : 'Gerando seções 6-10 (terapêutica)…'
    markUpTo('report', detail)
    return steps
  }

  if (status === 'processing_report') {
    markUpTo('report')
    return steps
  }

  if (status === 'processing_pdf') {
    markUpTo('pdf')
    return steps
  }
  if (status === 'processing_upload') {
    markUpTo('upload')
    return steps
  }
  if (status === 'processing_notify') {
    markUpTo('notify')
    return steps
  }

  markUpTo('init')
  return steps
}

function useElapsedTimer(isRunning: boolean, startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0)
      return
    }
    const origin = startedAt ?? Date.now()
    setElapsed(Math.max(0, Math.floor((Date.now() - origin) / 1000)))
    const id = setInterval(
      () => setElapsed(Math.max(0, Math.floor((Date.now() - origin) / 1000))),
      1000
    )
    return () => clearInterval(id)
  }, [isRunning, startedAt])

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`
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

function formatLogTime(ts: number, origin: number | null) {
  if (!origin) return ''
  const diff = Math.max(0, Math.floor((ts - origin) / 1000))
  const m = Math.floor(diff / 60)
  const s = diff % 60
  return m > 0
    ? `${m}:${s.toString().padStart(2, '0')}`
    : `0:${s.toString().padStart(2, '0')}`
}

interface ReportPreviewComponentProps {
  markdown: string | null
  pdfUrl: string | null
  reportHistory: ReportHistoryEntry[]
  isRegenerating?: boolean
  processingStatus?: string | null
  jobStartedAt?: number | null
  processingLogs?: ProcessingLogEntry[] | null
}

export function ReportPreviewComponent({
  markdown,
  pdfUrl,
  reportHistory,
  isRegenerating = false,
  processingStatus = null,
  jobStartedAt = null,
  processingLogs = null,
}: ReportPreviewComponentProps) {
  const totalVersions = reportHistory.length + (markdown ? 1 : 0)
  const [viewingVersion, setViewingVersion] = useState<number | null>(null)

  const viewingHistory =
    viewingVersion !== null ? reportHistory[viewingVersion] : null
  const displayMarkdown = viewingHistory?.report_markdown ?? markdown
  const displayPdfUrl = viewingHistory?.report_pdf_url ?? pdfUrl
  const isCurrentVersion = viewingVersion === null
  const pipeline = buildPipelineSteps(processingStatus)
  const elapsedStr = useElapsedTimer(isRegenerating, jobStartedAt)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const logs = processingLogs ?? []

  useEffect(() => {
    if (logs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs.length])

  return (
    <div>
      {/* Processing pipeline */}
      {isRegenerating && pipeline && (
        <div className="mb-4 rounded-lg border border-[rgba(240,160,48,0.3)] bg-[rgba(240,160,48,0.08)] px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#f0a030]" />
              <span className="text-sm font-semibold text-[#f0a030]">
                Gerando relatório
              </span>
            </div>
            <span className="font-mono text-xs text-[#5a7fa0]">
              {elapsedStr}
            </span>
          </div>

          <div className="space-y-1.5">
            {pipeline.map((step) => (
              <div key={step.id} className="flex items-center gap-2.5">
                {step.state === 'done' && (
                  <svg className="h-4 w-4 flex-shrink-0 text-[#00c9b1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {step.state === 'active' && (
                  <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#f0a030]" />
                )}
                {step.state === 'pending' && (
                  <div className="h-4 w-4 flex-shrink-0 rounded-full border border-[#1a3a5c]" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    step.state === 'done' && 'text-[#5a7fa0] line-through',
                    step.state === 'active' && 'font-medium text-[#f0a030]',
                    step.state === 'pending' && 'text-[#3a5a75]'
                  )}
                >
                  {step.label}
                </span>
                {step.detail && step.state === 'active' && (
                  <span className="text-xs text-[#5a7fa0]">
                    — {step.detail}
                  </span>
                )}
              </div>
            ))}
          </div>

          {logs.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded border border-[#1a3a5c] bg-[#0a1525] px-3 py-2 font-mono text-[11px] leading-relaxed">
              {logs.map((entry, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex-shrink-0 text-[#3a5a75]">
                    {formatLogTime(entry.t, jobStartedAt)}
                  </span>
                  <span
                    className={cn(
                      entry.m.startsWith('✅')
                        ? 'text-[#00c9b1]'
                        : entry.m.startsWith('❌') || entry.m.startsWith('✗')
                          ? 'text-red-400'
                          : 'text-[#7a9ab8]'
                    )}
                  >
                    {entry.m}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
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
