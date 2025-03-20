'use client'

import { useEffect } from 'react'

import { useModalController } from './modal-context'

const ContentModalLoading: React.FC = () => {
  const { startTransition } = useModalController()

  useEffect(() => {
    startTransition()
  }, [startTransition])

  return <></>
}

export default ContentModalLoading
