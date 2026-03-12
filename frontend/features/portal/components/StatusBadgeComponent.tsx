// frontend/features/portal/components/StatusBadgeComponent.tsx
'use client'

import { getStatusLabel } from '../helpers/format-evaluation'

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  pending_review: {
    bg: 'rgba(245,166,35,0.12)',
    text: '#f5b842',
    border: 'rgba(245,166,35,0.3)',
  },
  approved: {
    bg: 'rgba(0,216,150,0.12)',
    text: '#00d896',
    border: 'rgba(0,216,150,0.3)',
  },
  rejected: {
    bg: 'rgba(255,77,109,0.15)',
    text: '#ff6b85',
    border: 'rgba(255,77,109,0.3)',
  },
}

interface StatusBadgeComponentProps {
  status: string
}

export function StatusBadgeComponent({ status }: StatusBadgeComponentProps) {
  const style = STATUS_STYLES[status] ?? {
    bg: 'rgba(90,127,160,0.15)',
    text: '#5a7fa0',
    border: 'rgba(90,127,160,0.3)',
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {getStatusLabel(status)}
    </span>
  )
}

export function ProcessingStatusBadge({
  status,
}: {
  status: string | null | undefined
}) {
  if (!status) return null

  if (status === 'completed') return null

  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.12)] px-2.5 py-0.5 text-[11px] font-semibold text-[#ff6b85]">
        <svg
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        Erro
      </span>
    )
  }

  if (status.startsWith('processing')) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(240,160,48,0.3)] bg-[rgba(240,160,48,0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[#f0a030]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#f0a030]" />
        Gerando...
      </span>
    )
  }

  return null
}
