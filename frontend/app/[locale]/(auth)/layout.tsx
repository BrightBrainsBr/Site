import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono, Syne } from 'next/font/google'

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
  title: 'Bright Brains',
  description: 'Acesse sua conta Bright Brains',
  robots: 'noindex, nofollow',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${syne.variable} ${dmSans.variable} ${jetBrainsMono.variable} min-h-screen bg-[#060e1a] text-[#cce6f7] antialiased`}
      style={{ fontFamily: 'var(--font-sans-portal), sans-serif' }}
    >
      <main>{children}</main>
    </div>
  )
}
