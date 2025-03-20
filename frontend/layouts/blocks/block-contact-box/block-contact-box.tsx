import { StrapiTitle } from '@futurebrand/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import type { IStrapiTitle } from '@futurebrand/types/strapi'
import React from 'react'

import { AnimatedSection } from '@futurebrand/components'
import Form from '~/components/form'
import type { IForm } from '@futurebrand/types/form'

interface Properties {
  title: IStrapiTitle
  requiredText: string
  form?: IForm
}

const BlockSimplePageHero: React.FC<IBlockProps<Properties>> = async ({
  blockData,
}) => {
  if (!blockData.form) {
    return false
  }

  return (
    <AnimatedSection name="block-contact-box" anchor={blockData.anchor}>
      <div className="container-small mx-auto" style={{ maxWidth: '53.75rem' }}>
        <div
          className={animate({
            className: 'card w-full py-8 px-4 md:p-5 bg-white light',
          })}
        >
          <div className="w-full mb-5">
            <StrapiTitle
              component={blockData.title}
              className="text-current-primary text-3xl md:text-4xl md:text-center font-extralight"
            />
            <p className="mt-2 md:mt-5 text-sm">{blockData.requiredText}</p>
          </div>
          <Form form={blockData.form} formKey={`contact-${blockData.id}`} />
        </div>
      </div>
    </AnimatedSection>
  )
}

export default BlockSimplePageHero
