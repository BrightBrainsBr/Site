// frontend/app/[locale]/avaliacao/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Avaliação Digital | Bright Brains',
  description:
    'Formulário clínico completo para avaliação neuropsiquiátrica digital',
  robots: 'noindex, nofollow',
}

export default function AvaliacaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <span className="text-sm font-semibold text-zinc-200">
              Bright Brains
            </span>
          </div>
          <span className="rounded-full bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-400">
            Avaliação Digital
          </span>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
