import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { IForm } from '@futurebrand/types/form'
import type { HTMLString } from '@futurebrand/types/strapi'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import Form from '~/components/form'

interface Properties {
  content: HTMLString
  form: IForm
}

const BlockFormPartnership: React.FC<IBlockProps<Properties>> = ({
  blockData,
}) => {
  const { content, form, anchor } = blockData

  return (
    <AnimatedSection
      name="block-form-partnership"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="bg-midnight-950"
    >
      <div className="container grid grid-cols-1 lg:grid-cols-12 gap-5">
        {content && (
          <div className={twMerge('lg:col-span-3', animate())}>
            <span className="block w-[2.625rem] h-[0.125rem] bg-lime-400 mb-2" />
            <div
              className="cms-rich-text"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
        <Form
          containerClassName="form"
          className={twMerge(
            'lg:col-span-9 border text-white border-white rounded-2xl px-5 py-10 lg:p-10 !max-h-none',
            animate({ index: 1 })
          )}
          formKey="form-partnership"
          form={form}
        />
      </div>
    </AnimatedSection>
  )
}

export default BlockFormPartnership
