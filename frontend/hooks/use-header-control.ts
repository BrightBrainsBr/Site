import { useMemo } from 'react'

import useStateController from './use-state-controller'

function useHeaderControl() {
  const { headerVariant } = useStateController()

  const headerColor = useMemo(() => headerVariant, [headerVariant])

  return {
    headerColor,
  }
}

export default useHeaderControl
