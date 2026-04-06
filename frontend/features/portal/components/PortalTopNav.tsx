'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'

interface PortalTopNavProps {
  companyName?: string | null
}

export function PortalTopNav({ companyName }: PortalTopNavProps) {
  const params = useParams()
  const pathname = usePathname()
  const locale = (params?.locale as string) ?? 'pt-BR'

  const isEvaluations =
    pathname === `/${locale}/portal` || pathname === `/${locale}/portal/`
  const isEmpresas = pathname.includes('/portal/empresas')

  const navItems = [
    { label: 'Avaliações', href: `/${locale}/portal`, active: isEvaluations },
    {
      label: 'Empresas',
      href: `/${locale}/portal/empresas`,
      active: isEmpresas,
    },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.06)] bg-[#060d1a]" style={{ height: '57px' }}>
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href={`/${locale}/portal`} className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#00c9b1] to-[#0090ff]">
              <svg
                className="h-3.5 w-3.5 text-white"
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
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-[13px] font-bold text-[#e2e8f0]"
                style={{ fontFamily: 'var(--font-heading), sans-serif' }}
              >
                Bright Brains
              </span>
              <span className="text-[9px] uppercase tracking-[1.8px] text-[#334e68]">
                Portal
              </span>
            </div>
          </Link>

          <div className="mx-0.5 hidden h-4 w-px bg-[rgba(255,255,255,0.08)] sm:block" />

          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors md:text-[13px] ${
                  item.active
                    ? 'bg-[rgba(255,255,255,0.06)] text-[#e2e8f0]'
                    : 'text-[#4a6a85] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#94a3b8]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {companyName && (
            <>
              <div className="mx-0.5 hidden h-4 w-px bg-[rgba(255,255,255,0.08)] sm:block" />
              <span className="hidden truncate rounded-md border border-[rgba(0,201,177,0.2)] bg-[rgba(0,201,177,0.08)] px-2.5 py-1 text-[11px] font-medium text-[#00c9b1] sm:inline">
                {companyName}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
