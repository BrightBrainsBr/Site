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
