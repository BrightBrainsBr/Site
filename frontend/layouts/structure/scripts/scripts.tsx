import Script from 'next/script'
import React from 'react'
import { preconnect, prefetchDNS } from 'react-dom'

const CustomScriptsDomains = [
  'https://www.googletagmanager.com',
  'https://connect.facebook.net',
  'https://analytics.tiktok.com', // Adicionei o TikTok aqui para performance
]

const Scripts: React.FC = () => {
  // Se estiver em ambiente de desenvolvimento (localhost), não carrega os scripts para não sujar dados
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

      {/* --- CookieYes (Gestão de Cookies) --- */}
      <Script
        id="cookieyes"
        strategy="lazyOnload"
        src="https://cdn-cookieyes.com/client_data/85e361dd486ebb7ad2fa8289/script.js"
      />

      {/* --- TikTok Pixel --- */}
      <Script id="tiktok-pixel" strategy="lazyOnload">
        {`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},
            ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
            var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;
            var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(n,s)};

            ttq.load('D4JKEHBC77U7MI8IK1FG');
            ttq.page();
          }(window, document, 'ttq');
        `}
      </Script>
    </>
  )
}

export default Scripts
