// frontend/app/[locale]/empresa/layout.tsx

import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono, Syne } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { ReactQueryProvider } from '~/shared/providers/ReactQueryProvider'

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-heading',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans-portal',
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-portal',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Empresas | Bright Precision',
  description: 'Dashboard B2B de saúde cognitiva',
  robots: 'noindex, nofollow',
}

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NuqsAdapter>
      <ReactQueryProvider>
        <div
          className={`${syne.variable} ${dmSans.variable} ${jetBrainsMono.variable} min-h-screen bg-[#060d1a] text-[#e2e8f0] antialiased`}
          style={{ fontFamily: 'var(--font-sans-portal), sans-serif' }}
        >
          <main>{children}</main>
        </div>
      </ReactQueryProvider>
    </NuqsAdapter>
  )
}
