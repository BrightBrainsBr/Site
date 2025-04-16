import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { IForm } from '@futurebrand/types/form'
import type { HTMLString } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import Form from '~/components/form'

interface ICard {
  content: HTMLString
}

interface Properties {
  title: string
  form: IForm
  cards: ICard[]
}

const BlockFormContact: React.FC<IBlockProps<Properties>> = ({ blockData }) => {
  const { cards, form, title, anchor } = blockData

  if (!form) return null

  return (
    <AnimatedSection
      name="block-form-contact"
      anchor={anchor}
      spacing="padding"
      distance="medium"
      className="bg-gradient-to-b from-gray-light from-40% to-transparent"
    >
      <div className="container grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div
          className={twMerge(
            'border rounded-2xl px-5 py-10 lg:p-10 flex flex-col gap-6',
            animate()
          )}
        >
          {title && <h2 className="heading-4xl text-midnight-950">{title}</h2>}
          <Form form={form} formKey="form-contact" containerClassName="form" />
        </div>
        {cards.length > 0 && (
          <div
            className={twMerge('flex flex-col gap-5', animate({ index: 1 }))}
          >
            {cards.map((card, index) => (
              <div
                key={`card-${index}`}
                className="cms-rich-text border rounded-2xl px-5 py-10 lg:p-10"
                dangerouslySetInnerHTML={{ __html: card.content }}
              />
            ))}
          </div>
        )}
      </div>
    </AnimatedSection>
  )
}

export default BlockFormContact
