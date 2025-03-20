import { AnimatedSection } from '@futurebrand/components'
import { ContentService } from '@futurebrand/helpers-nextjs/services'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IModal } from '@futurebrand/types/contents'
import React from 'react'

import Background from '~/layouts/shared/backgroud'
import Main from '~/layouts/structure/main'

import Layout from './layout'
import type { IContactsPageProps } from './types'

const ContactsSingle: React.FC<IContactsPageProps> = async ({
  locale,
  params,
  previewData,
}) => {
  const service = new ContentService()
  const pageData = await service.single<IModal>({
    type: 'modals',
    locale,
    params,
    previewData,
  })

  return (
    <Main contentType="modals" localizations={pageData.localizations}>
      <Background className="min-h-screen py-10 md:py-20" color="black">
        <AnimatedSection
          name="contact-single"
          spacing="none"
          className="pt-16 lg:pt-20"
        >
          <div
            className="container-small mx-auto"
            style={{ maxWidth: '53.75rem' }}
          >
            <div
              className={animate({
                className: 'card w-full py-8 px-4 md:p-10 bg-white light',
              })}
            >
              <Layout pageData={pageData} isModalType={false} />
            </div>
          </div>
        </AnimatedSection>
      </Background>
    </Main>
  )
}

export default ContactsSingle
