import Script from 'next/script'
import React from 'react'
import { preconnect, prefetchDNS } from 'react-dom'

const CustomScriptsDomains = [
  'https://www.googletagmanager.com',
  'https://connect.facebook.net', // Facebook Pixel domain
]

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

      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s) {
            if(f.fbq) return;
            n=f.fbq=function() {
              n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)
            };
            if(!f._fbq) f._fbq=n;
            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];
            t=b.createElement(e);
            t.async=!0;
            t.src=v;
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
          }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1271906851245732');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* Using dangerouslySetInnerHTML for the noscript pixel to avoid Next.js Image requirements */}
        <div
          dangerouslySetInnerHTML={{
            __html: `
            <img 
              height="1" 
              width="1" 
              style="display:none"
              src="https://www.facebook.com/tr?id=1271906851245732&ev=PageView&noscript=1"
              alt=""
            />
          `,
          }}
        />
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
