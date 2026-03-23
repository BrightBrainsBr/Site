// frontend/features/portal/components/PortalHeaderComponent.tsx
'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

interface PortalHeaderComponentProps {
  totalCount: number
  pendingCount: number
  approvedCount: number
}

export function PortalHeaderComponent({
  totalCount,
  pendingCount,
  approvedCount,
}: PortalHeaderComponentProps) {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'pt-BR'

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#1a3a5c] bg-[#0c1a2e] px-8 py-4">
      <div className="flex items-center gap-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00c9b1] to-[#0090ff]">
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h1
            className="text-[18px] font-bold text-[#cce6f7]"
            style={{ fontFamily: 'var(--font-heading), sans-serif' }}
          >
            Bright Brains
          </h1>
          <p className="text-[11px] uppercase tracking-[2px] text-[#3a5a75]">
            Portal Clínico
          </p>
        </div>
        <nav className="flex gap-4">
          <Link
            href={`/${locale}/portal`}
            className="text-sm text-[#5a7fa0] hover:text-[#cce6f7]"
          >
            Avaliações
          </Link>
          <Link
            href={`/${locale}/portal/empresas`}
            className="text-sm text-[#5a7fa0] hover:text-[#cce6f7]"
          >
            Empresas
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-[#5a7fa0]">
          Pendentes: {pendingCount} · Aprovados: {approvedCount}
        </span>
        <span className="rounded-full bg-[#00c9b1] px-3 py-1 text-xs font-bold text-black">
          {totalCount} pacientes
        </span>
      </div>
    </header>
  )
}
