import Script from 'next/script'
import React from 'react'
import { preconnect, prefetchDNS } from 'react-dom'

const CustomScriptsDomains = ['https://www.googletagmanager.com']

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
    </>
  )
}

export default Scripts
