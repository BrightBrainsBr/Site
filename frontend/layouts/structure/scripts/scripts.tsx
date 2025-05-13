import Script from 'next/script'
import React from 'react'
import { preconnect, prefetchDNS } from 'react-dom'

const CustomScriptsDomains = ['https://www.googletagmanager.com']

const GOOGLE_TAG_MANAGER_ID = 'GTM-NLB73ZND'

const Scripts: React.FC = () => {
  if (process.env.NODE_ENV === 'development') return false

  for (const domain of CustomScriptsDomains) {
    preconnect(domain)
    prefetchDNS(domain)
  }

  return (
    <>
      <noscript>
        <style>
          {`
          .animation-content {
            opacity: 1 !important;
            transform: none !important;
          }
          `}
        </style>
      </noscript>
      <Script
        id="cookieyes"
        strategy="afterInteractive"
        src="https://cdn-cookieyes.com/client_data/85e361dd486ebb7ad2fa8289/script.js"
      />
      <Script id="google-tag-manager" strategy="lazyOnload">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayefavicon-32x32r'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');
        `}
      </Script>
    </>
  )
}

export default Scripts
