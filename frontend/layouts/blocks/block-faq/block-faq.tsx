import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { HTMLString } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import Accordion from '~/components/accordion'
import JsonLd from '~/components/seo/JsonLd'

interface IFaqItem {
  title: string
  content: HTMLString
}

interface Properties {
  title: string
  faq: IFaqItem[]
}

/**
 * Strips HTML tags and decodes common entities for use in schema.org text fields.
 * Preserves list item content by prefixing with bullet characters.
 */
function stripHtmlForSchema(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const BlockFaq: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { faq, title, anchor } = blockData

  const faqSchema = faq && faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtmlForSchema(item.content),
      },
    })),
  } : null

  return (
    <>
      {faqSchema && <JsonLd data={faqSchema} />}
      <AnimatedSection
        name="block-faq"
        anchor={anchor}
        spacing="padding"
        distance="small"
        className="bg-gray-light"
      >
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-5">
          {title && (
            <div
              className={twMerge('lg:col-span-3 text-midnight-950', animate())}
            >
              <span className="block w-[2.625rem] h-[0.125rem] bg-current mb-2" />
              <h2 className="heading-4xl">{title}</h2>
            </div>
          )}
          {faq.length > 0 && (
            <div className={twMerge('lg:col-span-9', animate({ index: 1 }))}>
              {faq.map((faqItem, index) => (
                <Accordion
                  key={`faqItem-${index}`}
                  title={faqItem.title}
                  className="border-gray-secondary-dark text-midnight-950 px-4"
                >
                  {faqItem.content && (
                    <div
                      className="cms-rich-text py-4"
                      dangerouslySetInnerHTML={{ __html: faqItem.content }}
                    />
                  )}
                </Accordion>
              ))}
            </div>
          )}
        </div>
      </AnimatedSection>
    </>
  )
}

export default BlockFaq

