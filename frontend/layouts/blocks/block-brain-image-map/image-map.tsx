/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { animate } from '@futurebrand/helpers-nextjs/utils'
import Image from 'next/image'
import React, { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

import type { ISymptom } from './block-brain-image-map'

interface Properties {
  data: ISymptom[]
  accent: string
}

export const colorVariant = tv({
  variants: {
    color: {
      'blue-400': 'text-blue-400',
      'green-400': 'text-green-400',
      'violet-400': 'text-violet-400',
    },
  },
})

const ImageMap: React.FC<Properties> = ({ accent = 'green-400', data }) => {
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  const selectMapGroup: any = () => {
    switch (accent) {
      case 'blue-400': {
        return [
          '/brain-blue-2.svg',
          '/brain-blue-2.svg',
          '/brain-blue-2.svg',
          '/brain-blue-2.svg',
          '/brain-blue-1.svg',
          '/brain-blue-1.svg',
          '/brain-blue-3.svg',
          '/brain-blue-3.svg',
        ]
      }
      case 'green-400': {
        return [
          '/brain-green-2.svg',
          '/brain-green-2.svg',
          '/brain-green-2.svg',
          '/brain-green-2.svg',
          '/brain-green-1.svg',
          '/brain-green-1.svg',
          '/brain-green-3.svg',
          '/brain-green-3.svg',
        ]
      }
      case 'violet-400': {
        return [
          '/brain-violet-2.svg',
          '/brain-violet-2.svg',
          '/brain-violet-2.svg',
          '/brain-violet-2.svg',
          '/brain-violet-1.svg',
          '/brain-violet-1.svg',
          '/brain-violet-3.svg',
          '/brain-violet-3.svg',
        ]
      }
    }
  }

  if (!data || data.length === 0) return null

  return (
    <div
      className={twMerge(
        'hidden lg:grid lg:grid-cols-7 lg:gap-5 lg:col-span-7 lg:col-start-5 lg:h-[45.48vh] lg:min-h-[23.875rem]',
        animate({ index: 1 })
      )}
    >
      {data.length > 0 && (
        <ul className="col-span-2">
          {data.slice(0, 4).map((firstColumn, index) => (
            <li
              key={`first-column-${index}`}
              className="relative h-1/4 text-right flex flex-col justify-center items-end gap-4"
            >
              <button
                className={twMerge(
                  'transition-colors duration-200 heading-xl',
                  activeIndex === index &&
                    colorVariant({ color: accent as any })
                )}
                onMouseEnter={() => {
                  setActiveIndex(index)
                }}
                onMouseLeave={() => {
                  setActiveIndex(-1)
                }}
              >
                {firstColumn.title}
              </button>
              {firstColumn.description && (
                <span
                  className={twMerge(
                    'absolute z-10 top-[calc(50%+30px)] right-0 opacity-0 p-4 text-sm bg-white text-gray-secondary-dark w-[19.31vw]',
                    activeIndex === index ? 'block animate-fadein' : 'hidden'
                  )}
                >
                  {firstColumn.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <picture className="relative block col-span-3">
        <Image
          className={twMerge(
            'w-[21.39vw] absolute top-1/2 left-1/2 -translate-1/2 transition-opacity duration-300',
            activeIndex === -1 ? 'opacity-100' : 'opacity-0'
          )}
          src={
            (accent === 'blue-400' && '/brain-blue-default.svg') ||
            (accent === 'green-400' && '/brain-green-default.svg') ||
            (accent === 'violet-400' && '/brain-violet-default.svg') ||
            ''
          }
          width={308}
          height={302}
          alt="Brain Image Map"
        />
        {data.map((image, index) => (
          <Image
            className={twMerge(
              'w-[21.39vw] absolute top-1/2 left-1/2 -translate-1/2 transition-opacity duration-300',
              activeIndex === index ? 'opacity-100' : 'opacity-0'
            )}
            key={`image-${index}`}
            src={
              selectMapGroup()[activeIndex] ||
              (accent === 'blue-400' && '/brain-blue-default.svg') ||
              (accent === 'green-400' && '/brain-green-default.svg') ||
              (accent === 'violet-400' && '/brain-violet-default.svg')
            }
            width={308}
            height={302}
            alt="Brain Image Map"
          />
        ))}
      </picture>
      {data.length > 4 && (
        <ul className="col-span-2">
          {data.slice(4, 8).map((secoundColumn, index) => (
            <li
              key={`secound-column-${index}`}
              className="relative h-1/4 flex flex-col justify-center items-start gap-4"
            >
              <button
                className={twMerge(
                  'transition-colors duration-200 heading-xl',
                  activeIndex === index + 4 &&
                    colorVariant({ color: accent as any })
                )}
                onMouseEnter={() => {
                  setActiveIndex(index + 4)
                }}
                onMouseLeave={() => {
                  setActiveIndex(-1)
                }}
              >
                {secoundColumn.title}
              </button>
              {secoundColumn.description && (
                <span
                  className={twMerge(
                    'absolute z-10 top-[calc(50%+30px)] left-0 opacity-0 p-4 text-sm bg-white text-gray-secondary-dark w-[19.31vw]',
                    activeIndex === index + 4
                      ? 'block animate-fadein'
                      : 'hidden'
                  )}
                >
                  {secoundColumn.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ImageMap
