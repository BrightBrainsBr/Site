'use client'

import { useState } from 'react'
import { cn } from '~/shared/utils/cn'
import type { ReportHistoryEntry } from '../portal.interface'

function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-[#00c9b1] mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-[#cce6f7] mt-6 mb-3 pb-2 border-b border-[rgba(0,201,177,0.2)]">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-[#cce6f7] mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#cce6f7]">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-[#cce6f7]">$1</li>')
    .replace(/^---$/gm, '<hr class="border-[#1a3a5c] my-4" />')
    .replace(/\n\n/g, '<br/><br/>')
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
}

export function ReportPreviewComponent({
  markdown,
  pdfUrl,
  reportHistory,
  isRegenerating = false,
}: ReportPreviewComponentProps) {
  const totalVersions = reportHistory.length + (markdown ? 1 : 0)
  const [viewingVersion, setViewingVersion] = useState<number | null>(null)

  const viewingHistory =
    viewingVersion !== null ? reportHistory[viewingVersion] : null
  const displayMarkdown = viewingHistory?.report_markdown ?? markdown
  const displayPdfUrl = viewingHistory?.report_pdf_url ?? pdfUrl
  const isCurrentVersion = viewingVersion === null

  return (
    <div>
      {/* Regenerating banner */}
      {isRegenerating && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[rgba(240,160,48,0.3)] bg-[rgba(240,160,48,0.08)] px-4 py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#f0a030]" />
          <div>
            <p className="text-sm font-medium text-[#f0a030]">
              Relatório sendo regenerado...
            </p>
            <p className="text-xs text-[#5a7fa0]">
              Este processo pode demorar alguns minutos. A página atualizará
              automaticamente.
            </p>
          </div>
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
          <div
            className="rounded-lg border-l-[3px] border-l-[#00c9b1] bg-[#0f2240] p-4 text-sm leading-[1.75] text-[#cce6f7]"
            dangerouslySetInnerHTML={{
              __html: simpleMarkdownToHtml(displayMarkdown),
            }}
          />
        </>
      ) : null}
    </div>
  )
}
