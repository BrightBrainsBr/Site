import '~/styles/index.css'

import { Inter } from 'next/font/google'
import React from 'react'

import Scripts from '~/layouts/structure/scripts'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
  preload: true,
})

export const revalidate = 60
export const dynamicParams = true

const RootLayout = async ({ children, params }: any) => {
  const { locale } = await params

  return (
    <html lang={locale} className={`${inter.variable} font-sans`}>
      <head>
        <Scripts />
      </head>
      <body>{children}</body>
    </html>
  )
}

export default RootLayout
