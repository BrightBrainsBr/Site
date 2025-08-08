/* eslint-disable @next/next/next-script-for-ga */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WQ538QRM');`,
          }}
        />
        {/* Facebook Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1271906851245732');
            fbq('track', 'PageView');
            `,
          }}
        />
        {/* Facebook Pixel Code - Second Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1775920403022220');
            fbq('track', 'PageView');
            `,
          }}
        />
        <Scripts />
        <noscript>
          <img 
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1271906851245732&ev=PageView&noscript=1"
          />
        </noscript>
        <noscript>
          <img 
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1775920403022220&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WQ538QRM"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {children}
      </body>
    </html>
  )
}

export default RootLayout
