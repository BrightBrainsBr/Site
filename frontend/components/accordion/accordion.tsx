'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { ReactComponent as ArrowIcon } from '~/assets/icons/small-caret-down.svg'

interface Props extends React.BaseHTMLAttributes<HTMLDivElement> {
  title: string
  isBigType?: boolean
}

const Accordion: React.FC<Props> = ({
  title,
  isBigType,
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
      className={`py-1 border-b-gray-medium border-b ${isBigType ? 'md:py-2' : ''} last:border-none first:pt-0 ${className || ''}`}
      {...rest}
    >
      <button
        className="py-3 flex flex-row items-center justify-between text-left gap-2 w-full hover:text-blue-medium"
        onClick={onClickAccordion}
      >
        <p
          style={{ maxWidth: '80%' }}
          className={`font-bold ${isBigType ? 'text-2xl md:text-3xl md:font-medium md:pt-4' : 'text-lg '}`}
        >
          {title}
        </p>
        <ArrowIcon
          className={`relative flex-none transition-transform ${isBigType ? 'w-8 h-8 md:w-9 md:h-9 md:top-1' : 'w-6 h-6 '} ${opened ? 'rotate-x-180' : ''}`}
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
