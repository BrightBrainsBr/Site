import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import Image from 'next/image'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import CMSButton from '~/components/button/cms'

const HeadlineContact = () => {
  return (
    <AnimatedSection
      name="block-headline-contact"
      spacing="padding"
      distance="small"
      className="h-[30rem] lg:h-[71.43vh] lg:min-h-[37.5rem] bg-gradient-to-t from-transparent from-40% to-gray-light"
    >
      <div className="container h-full">
        <div className="relative rounded-3xl overflow-hidden h-full p-5 lg:p-0 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Image
            src="/headline-contact.png"
            width={1300}
            height={480}
            alt="headline contact background image"
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          <div className="relative z-10 lg:col-span-10 lg:col-start-2 flex flex-col justify-end lg:justify-center gap-6 h-full">
            <div className={twMerge('lg:max-w-[32.5vw] font-kmr', animate())}>
              <span className="block text-lg uppercase text-midnight-950">
                fale conosco
              </span>
              <h2 className="heading-6xl text-white">Agende sua consulta</h2>
            </div>
            <CMSButton
              attributes={{
                id: 5647,
                text: 'enviar mensagem',
                url: '/fale-conosco',
                variant: 'midnight-950',
              }}
              className={twMerge('w-fit', animate({ index: 1 }))}
            />
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

export default HeadlineContact
