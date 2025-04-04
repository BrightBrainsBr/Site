import { useMemo } from 'react'

import useStateController from './use-state-controller'

function useThemeControl() {
  const { themeVariant } = useStateController()

  const themeColor = useMemo(() => themeVariant, [themeVariant])

  return {
    themeColor,
  }
}

export default useThemeControl
