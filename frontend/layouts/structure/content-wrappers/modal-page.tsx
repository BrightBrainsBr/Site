'use client'

import { useEffect, useState } from 'react'

import { useModalController } from './modal-context'

interface Props extends React.PropsWithChildren {
  modalKey: string
}

const ContentModalPage: React.FC<Props> = ({ modalKey, children }) => {
  const { hide, show } = useModalController()
  const [isStarted, setStarted] = useState(false)

  useEffect(() => {
    const payload = (children as any)?._payload

    if (payload?.status !== 'fulfilled') {
      return
    }

    if (!isStarted) {
      setStarted(true)
      show(modalKey, payload.value as React.ReactElement)
    }
    return () => {
      if (isStarted) {
        hide(modalKey)
        setStarted(false)
      }
    }
  }, [children, hide, isStarted, modalKey, show])

  return <>{children}</>
}

export default ContentModalPage
