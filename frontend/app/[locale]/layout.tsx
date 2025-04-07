import '~/styles/index.css'

import { Roboto } from 'next/font/google'
import localFont from 'next/font/local'
import React from 'react'

import Scripts from '~/layouts/structure/scripts'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  preload: true,
})

const kmr = localFont({
  src: [
    {
      path: '../../assets/fonts/KMR-Apparat-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/KMR-Apparat-Heavy.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/KMR-Apparat-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/KMR-Apparat-Book.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/KMR-Apparat-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/KMR-Apparat-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/KMR-Apparat-Light.woff2',
      weight: '300',
      style: 'normal',
    },
  ],
  variable: '--font-kmr',
  preload: true,
})

export const revalidate = 60
export const dynamicParams = true

const RootLayout = async ({ children, params }: any) => {
  const { locale } = await params

  return (
    <html
      lang={locale}
      className={`${roboto.variable} font-sans ${kmr.variable}`}
    >
      <head>
        <Scripts />
      </head>
      <body>{children}</body>
    </html>
  )
}

export default RootLayout
