'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { createContext, useCallback, useEffect, useState } from 'react'

import Loading from '~/components/loading'
import Modal from '~/components/modal'

import type { IWrapperModal } from './types'
import useModalData from './use-modal-data'

interface IContentModalContext {
  hide: (key?: string) => void
  startTransition: () => void
  show: (key: string, layout: React.ReactElement) => void
}

export const ContentModalContext = createContext<IContentModalContext>(
  {} as unknown as IContentModalContext
)

const ContentModalProvider = ({ children }: React.PropsWithChildren) => {
  const [isModalLoading, setModalLoading] = useState(false)

  const pathName = usePathname()
  const [currentPathName, setCurrentPathName] = useState(pathName)
  const [lastPathName, setLastPathName] = useState<string | null>(null)

  const [nextActiveKey, setNextActiveKey] = useState<string>()
  const modals = useModalData()

  useEffect(() => {
    if (currentPathName === pathName) return

    setLastPathName(currentPathName)
    setCurrentPathName(pathName)
  }, [currentPathName, pathName])

  const router = useRouter()

  const hide = useCallback(
    (key?: string) => {
      setModalLoading(false)
      setNextActiveKey(undefined)
      if (key) {
        modals.disable(key)
      } else {
        modals.disable()
      }
    },
    [modals.disable]
  )

  const startTransition = useCallback(() => {
    setModalLoading(true)
    setNextActiveKey(undefined)
  }, [])

  const show = useCallback(
    (key: string, layout: React.ReactElement) => {
      modals.push(key, layout)
      setNextActiveKey(key)
    },
    [modals.push]
  )

  const onModalLoaded = useCallback(
    (modal: IWrapperModal) => {
      return () => {
        if (modal.key === nextActiveKey) {
          modals.activate(modal.key)
          setNextActiveKey(undefined)
          setModalLoading(false)
        }
      }
    },
    [nextActiveKey, modals.activate]
  )

  return (
    <ContentModalContext.Provider
      value={{
        hide,
        show,
        startTransition,
      }}
    >
      <div
        className={`fixed w-full h-full top-0 left-0 transition-opacity !duration-500 pointer-events-none ${isModalLoading ? 'opacity-100' : 'opacity-0'}`}
        style={{
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        <div className="absolute left-0 top-0 w-full h-full z-10 flex items-center justify-center">
          <Loading className="text-white" />
        </div>
      </div>
      {modals.data.map((modal) => (
        <Modal
          id={modal.key}
          key={modal.key}
          isActive={modal.active}
          onLoad={onModalLoaded(modal)}
          onClose={() => {
            if (!lastPathName) {
              router.back()
            } else {
              router.push(lastPathName, {
                scroll: false,
              })
            }
          }}
        >
          {modal.layout}
        </Modal>
      ))}
      <div className="hidden">{children}</div>
    </ContentModalContext.Provider>
  )
}

export function useModalController() {
  return React.useContext(ContentModalContext)
}

export default ContentModalProvider
