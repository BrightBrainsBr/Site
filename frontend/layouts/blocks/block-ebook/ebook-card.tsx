'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type { IEbook } from './ebook-data'

interface Properties {
  ebook: IEbook
  index?: number
}

const EbookCard: React.FC<Properties> = ({ ebook, index = 0 }) => {
  return (
    <div
      className={twMerge(
        'border border-gray-secondary-dark rounded-2xl p-6 lg:p-8 flex flex-col gap-5 bg-white hover:shadow-lg transition-all duration-300',
        animate({ index })
      )}
    >
      {ebook.category && (
        <span className="text-xs uppercase text-lime-400 font-bold">
          {ebook.category}
        </span>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="heading-2xl text-midnight-950">{ebook.title}</h3>
        {ebook.description && (
          <p className="text-midnight-950/70">{ebook.description}</p>
        )}
      </div>

      <a
        href={ebook.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="mt-auto w-full sm:w-auto px-6 py-3 bg-midnight-950 text-white rounded-full font-bold uppercase text-sm hover:bg-midnight-950/90 transition-colors text-center"
      >
        Baixar E-book (PDF)
      </a>
    </div>
  )
}

export default EbookCard
