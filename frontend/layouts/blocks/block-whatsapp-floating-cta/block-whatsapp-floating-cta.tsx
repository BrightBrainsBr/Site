'use client'

import { Link } from '@futurebrand/helpers-nextjs/components'
import type { IBlockProps } from '@futurebrand/types/contents'
import React from 'react'

import { ReactComponent as WhatsApp } from '~/assets/icons/whatsapp.svg'

interface Properties {
  url: string
}

const BlockWhatsappFloatingCta: React.FC<IBlockProps<Properties>> = ({
  blockData,
}) => {
  const { url } = blockData

  return (
    <Link
      href={url}
      name="Whatsapp Cta"
      blank
      className="fixed bottom-4 lg:bottom-[4.375rem] right-4 lg:right-[4.375rem] z-50 bg-[#25D366] rounded-[2.75rem] lg:px-5 p-3 flex items-center gap-3 opacity-0 animate-fadein hover:bg-green-500 transition-colors duration-300"
    >
      <span className="hidden lg:block text-white">Agendar</span>
      <WhatsApp className="w-6 h-6" />
    </Link>
  )
}

export default BlockWhatsappFloatingCta
