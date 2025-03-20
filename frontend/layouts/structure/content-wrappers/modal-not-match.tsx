'use client'

import { useEffect } from 'react'

import { useModalController } from './modal-context'

const ContentModalLoading: React.FC = () => {
  const { hide } = useModalController()

  useEffect(() => {
    hide()
  }, [hide])

  return <></>
}

export default ContentModalLoading
