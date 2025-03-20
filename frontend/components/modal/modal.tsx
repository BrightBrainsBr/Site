'use client'

import { useOutsideClick } from '@futurebrand/hooks'
import React, {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { tv } from 'tailwind-variants'

import Loading from '../loading'
import CloseButton from './close'

interface Properties {
  id?: string
  isActive: boolean
  isLoading?: boolean
  onClose: () => void
  onLoad?: () => void
}

const modalClassVariant = tv({
  slots: {
    base: 'fixed top-0 left-0 w-full h-full overflow-hidden',
    background:
      'absolute top-0 transition-opacity !duration-500 left-0 z-0 w-full h-full bg-black/70',
    box: 'relative z-10 transition-[opacity,transform] duration-300 ease-out w-fit h-full sm:h-auto bg-white sm:rounded-md sm:shadow-card',
    content: 'h-full overflow-y-auto sm:h-auto sm:overflow-auto',
  },
  variants: {
    showing: {
      true: {
        base: 'pointer-events-auto sm:overflow-y-auto',
        background: 'opacity-100',
      },
      false: {
        base: 'pointer-events-none overflow-y-hidden',
        background: 'opacity-0',
      },
    },
    active: {
      false: {
        box: 'opacity-0 scale-75',
      },
      true: {
        box: 'opacity-100 scale-100',
      },
    },
  },
})

const Modal: React.FC<React.PropsWithChildren<Properties>> = ({
  id,
  isActive,
  isLoading,
  onClose,
  onLoad,
  children,
}) => {
  const [isActiveControl, setActiveControl] = useState(false)

  const onClickOutside = useCallback(() => {
    if (isActiveControl) {
      onClose()
    }
  }, [isActiveControl, onClose])
  const outsideReference = useOutsideClick<HTMLDivElement>(onClickOutside)

  const containerRef = useRef<HTMLDivElement>(null)

  const classNames = modalClassVariant({
    showing: isActiveControl || isLoading,
    active: isActiveControl,
  })

  useEffect(() => {
    if (isActiveControl) {
      containerRef.current?.scrollTo(0, 0)
    }

    document.body.style.overflow = isActiveControl ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isActiveControl])

  // Delay the transition to avoid flickering
  useEffect(() => {
    window.requestAnimationFrame(() => {
      setActiveControl(isActive)
    })
  }, [isActive])

  // Call the onLoad function when the modal script is already loaded
  useEffect(() => {
    if (onLoad) {
      startTransition(() => {
        onLoad()
      })
    }
  }, [onLoad])

  return (
    <div
      id={id}
      className={classNames.base()}
      ref={containerRef}
      aria-hidden={!isActiveControl}
      style={{
        zIndex: 9999,
      }}
    >
      <div className="relative flex justify-center items-center w-full h-full sm:h-auto sm:min-h-full sm:p-8 md:py-10 lg:py-16">
        <div className={classNames.background()} />
        {!isActiveControl && isLoading && (
          <div className="absolute left-0 top-0 w-full h-full z-10 flex items-center justify-center">
            <Loading className="text-current-primary" />
          </div>
        )}
        <div className={classNames.box()} ref={outsideReference}>
          <CloseButton isActive={isActiveControl} onClick={onClose} />
          <div className={classNames.content()}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Modal
