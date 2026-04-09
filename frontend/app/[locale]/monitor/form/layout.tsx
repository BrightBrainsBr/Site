import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bright Monitor | Avaliação NR-1',
  description: 'Formulário de avaliação para colaboradores — conformidade NR-1',
  robots: 'noindex, nofollow',
}

export default function MonitorFormLayout({
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
