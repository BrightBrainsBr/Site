// frontend/features/portal/components/ProfileBadgeComponent.tsx
'use client'

import { getProfileLabel } from '../helpers/format-evaluation'

const PROFILE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  adulto: {
    bg: 'rgba(96,165,250,0.12)',
    text: '#93c5fd',
    dot: '#93c5fd',
  },
  infantil: {
    bg: 'rgba(52,211,153,0.13)',
    text: '#6ee7b7',
    dot: '#6ee7b7',
  },
  neuro: {
    bg: 'rgba(167,139,250,0.15)',
    text: '#c4b5fd',
    dot: '#c4b5fd',
  },
  executivo: {
    bg: 'rgba(251,191,36,0.12)',
    text: '#fcd34d',
    dot: '#fcd34d',
  },
  longevidade: {
    bg: 'rgba(251,146,60,0.12)',
    text: '#fdba74',
    dot: '#fdba74',
  },
}

interface ProfileBadgeComponentProps {
  profile: string
}

export function ProfileBadgeComponent({ profile }: ProfileBadgeComponentProps) {
  const style = PROFILE_STYLES[profile] ?? {
    bg: 'rgba(90,127,160,0.15)',
    text: '#5a7fa0',
    dot: '#5a7fa0',
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: style.dot }}
      />
      {getProfileLabel(profile)}
    </span>
  )
}
