import React, { useCallback, useState } from 'react'

import type { IWrapperModal } from './types'

function useModalData() {
  const [modalData, setModalData] = useState<IWrapperModal[]>([])

  const push = useCallback((key: string, layout: React.ReactElement) => {
    setModalData((prevData) => {
      const current = prevData.find((modal) => modal.key === key)
      if (current) {
        const others = prevData.filter((modal) => modal.key !== key)
        const newArray = [current, ...others]
        return newArray
      } else {
        if (React.isValidElement(layout)) {
          const clone = React.cloneElement(layout)
          const newModal = {
            key,
            layout: clone,
            active: false,
          }

          return [newModal, ...prevData].slice(0, 5)
        }
        return prevData
      }
    })
  }, [])

  const activate = useCallback((key: string) => {
    setModalData((prev) => {
      return prev.map((modal) => {
        if (modal.key === key) {
          return {
            ...modal,
            active: true,
          }
        }
        return {
          ...modal,
          active: false,
        }
      })
    })
  }, [])

  const disable = useCallback((key?: string) => {
    setModalData((prev) => {
      return prev.map((modal) => {
        if (key == null || modal.key === key) {
          return {
            ...modal,
            active: false,
          }
        }
        return modal
      })
    })
  }, [])

  return {
    data: modalData,
    push,
    activate,
    disable,
  }
}

export default useModalData
