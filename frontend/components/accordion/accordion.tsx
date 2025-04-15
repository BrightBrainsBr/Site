'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { ReactComponent as ArrowIcon } from '~/assets/icons/small-caret-down.svg'

interface Props extends React.BaseHTMLAttributes<HTMLDivElement> {
  title: string
  isSelect?: boolean
  isForMenu?: boolean
}

const Accordion: React.FC<Props> = ({
  title,
  isSelect,
  isForMenu,
  children,
  className,
  ...rest
}) => {
  const [contentHeight, setContentHeight] = useState<number>(0)
  const [opened, setOpened] = useState(false)

  const contentReference = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const content = contentReference.current

    if (!content) return
    setContentHeight(content.scrollHeight)
    const mutationObserver = new MutationObserver(function () {
      setContentHeight(content.scrollHeight)
    })

    mutationObserver.observe(content, {
      childList: true,
      subtree: true,
    })

    return () => {
      mutationObserver.disconnect()
    }
  }, [])

  const onClickAccordion = useCallback(() => {
    setOpened((current) => !current)
  }, [])

  return (
    <div
      className={twMerge(
        isSelect
          ? 'border border-gray-secondary-dark'
          : 'border-b-gray-medium border-b last:border-none first:pt-0',
        className
      )}
      {...rest}
    >
      <button
        className={twMerge(
          'flex flex-row items-center justify-between text-left gap-2 w-full hover:text-blue-medium',
          !isForMenu && 'py-3'
        )}
        onClick={onClickAccordion}
      >
        <p
          style={{ maxWidth: '80%' }}
          className={twMerge(
            isSelect ? 'text-base' : 'text-lg',
            isForMenu && 'text-[1.875rem] font-kmr text-midnight-950'
          )}
        >
          {title}
        </p>
        <ArrowIcon
          className={`relative flex-none transition-transform ${isSelect ? 'w-6 h-6' : 'w-10 h-10'} ${opened ? 'rotate-x-180' : ''}`}
        />
      </button>
      <div
        ref={contentReference}
        className="overflow-hidden transition-all"
        style={{
          maxHeight: opened ? contentHeight : 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default Accordion
