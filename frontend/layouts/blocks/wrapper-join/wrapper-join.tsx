import { StrapiTitle } from '@futurebrand/components'
import type { IWrapperProps } from '@futurebrand/types/contents'
import { type IStrapiTitle } from '@futurebrand/types/strapi'
import { animate } from '@futurebrand/utils'
import React from 'react'

import { AnimatedSection } from '@futurebrand/components'

interface Properties {
  title: IStrapiTitle
  description: string
}

const WrapperJoin: React.FC<IWrapperProps<Properties>> = async ({
  blockData,
  children,
}) => {
  return (
    <AnimatedSection
      name="wrapper-join-title"
      distance="small"
      className="wrapper-join my-20"
    >
      <div className="container mb-12">
        <StrapiTitle component={blockData.title} />
        {blockData.description && (
          <p
            className={animate({ className: 'mt-2', index: 1 })}
            style={{ maxWidth: '80%' }}
          >
            {blockData.description}
          </p>
        )}
      </div>
      <>{children}</>
    </AnimatedSection>
  )
}

export default WrapperJoin
