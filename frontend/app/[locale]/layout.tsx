/* eslint-disable @next/next/next-script-for-ga */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

import '~/styles/index.css'

import { Roboto } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'
import React from 'react'

import Scripts from '~/layouts/structure/scripts'
import { NuqsProvider } from '~/shared/providers/NuqsProvider'
import { ReactQueryProvider } from '~/shared/providers/ReactQueryProvider'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  preload: true,
  display: 'optional',
  adjustFontFallback: true,
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
  display: 'optional',
  adjustFontFallback: 'Arial',
})

export const revalidate = 300
export const dynamicParams = true

const SITE_URL = 'https://www.brightbrains.com.br'

function buildGlobalSchema(locale: string) {
  const langCode = locale === 'en' ? 'en' : 'pt-BR'
  const searchLocale = locale === 'en' ? 'en' : 'pt-BR'

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Bright Brains - Instituto da Mente',
        url: SITE_URL,
        inLanguage: langCode,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo-light.svg`,
        },
        description:
          'Clínica especializada em neuromodulação não invasiva aplicada à saúde mental e neurológica, utilizando técnicas como Estimulação Magnética Transcraniana (TMS) e Estimulação Transcraniana por Corrente Contínua (tDCS) para tratamento de transtornos neuropsiquiátricos, doenças neurológicas e otimização cognitiva.',
        telephone: '+55-11-3042-2857',
        email: 'contato@brightbrains.com.br',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Rua Joaquim Floriano, 72',
          addressLocality: 'São Paulo',
          addressRegion: 'SP',
          addressCountry: 'BR',
        },
        sameAs: [
          'https://www.instagram.com/brightbrainsbr/',
          'https://br.linkedin.com/company/bright-brains-brasil',
          'https://www.youtube.com/@BrightBrainsBr',
        ],
      },
      {
        '@type': 'MedicalClinic',
        '@id': `${SITE_URL}/#clinic`,
        name: 'Bright Brains - Instituto da Mente',
        url: SITE_URL,
        inLanguage: langCode,
        isPartOf: {
          '@id': `${SITE_URL}/#organization`,
        },
        description:
          'Clínica especializada em neuromodulação não invasiva aplicada à saúde mental e neurológica.',
        telephone: '+55-11-3042-2857',
        email: 'contato@brightbrains.com.br',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Rua Joaquim Floriano, 72',
          addressLocality: 'São Paulo',
          addressRegion: 'SP',
          addressCountry: 'BR',
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Brazil',
        },
        availableService: [
          {
            '@type': 'MedicalTherapy',
            name: 'Estimulação Magnética Transcraniana (TMS)',
          },
          {
            '@type': 'MedicalTherapy',
            name: 'Estimulação Transcraniana por Corrente Contínua (tDCS)',
          },
        ],
        medicalSpecialty: [
          'Neuromodulation',
          'Neurology',
          'Psychiatry',
          'MentalHealth',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Bright Brains - Instituto da Mente',
        url: SITE_URL,
        inLanguage: langCode,
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/${searchLocale}/noticias?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}

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
        <link
          rel="manifest"
          href="/site.webmanifest"
          crossOrigin="use-credentials"
        />

        {/* Auth token interceptor — catches Supabase hash tokens on any page */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=window.location.hash;if(!h)return;var p=new URLSearchParams(h.substring(1));if(p.get('access_token')&&p.get('refresh_token')){var dest='/pt-BR/empresa/auth-callback'+h;if(window.location.pathname!=='/pt-BR/empresa/auth-callback'){window.location.replace(dest)}}})();`,
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildGlobalSchema(locale)),
          }}
        />

        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WQ538QRM');`,
          }}
        />

        {/* Facebook Pixel Code */}
        <Script
          id="fb-pixel-1"
          strategy="lazyOnload"
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
        <Script
          id="fb-pixel-2"
          strategy="lazyOnload"
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
        <ReactQueryProvider>
          <NuqsProvider>{children}</NuqsProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}

export default RootLayout
