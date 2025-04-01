import { useContext } from 'react'

import { StateControllerContext } from '~/contexts/state-controller'

function useStateController() {
  return useContext(StateControllerContext)
}

export default useStateController
