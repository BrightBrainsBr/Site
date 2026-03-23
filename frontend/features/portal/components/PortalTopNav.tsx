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
    <header className="sticky top-0 z-50 border-b border-[#1a3a5c] bg-[#0c1a2e]">
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-5">
          <Link href={`/${locale}/portal`} className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00c9b1] to-[#0090ff]">
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
              <span
                className="text-[15px] font-bold text-[#cce6f7]"
                style={{ fontFamily: 'var(--font-heading), sans-serif' }}
              >
                Bright Brains
              </span>
              <span className="ml-2 text-[10px] uppercase tracking-[1.5px] text-[#3a5a75]">
                Portal
              </span>
            </div>
          </Link>

          <div className="mx-2 h-5 w-px bg-[#1a3a5c]" />

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  item.active
                    ? 'bg-[#0E1E33] text-[#cce6f7]'
                    : 'text-[#5a7fa0] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#cce6f7]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {companyName && (
            <>
              <div className="mx-1 h-5 w-px bg-[#1a3a5c]" />
              <span className="rounded-md bg-[#14B8A6]/10 px-2.5 py-1 text-[12px] font-medium text-[#14B8A6]">
                {companyName}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
