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
      <main>{children}</main>
    </div>
  )
}
