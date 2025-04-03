'use client'

import React, { createContext, useState } from 'react'

interface IStateControllerContext {
  headerVariant: 'midnight-950' | 'blue-400' | 'green-400' | 'lime-400' | 'violet-400'
  setHeaderVariant: (variant: 'midnight-950' | 'blue-400' | 'green-400' | 'lime-400' | 'violet-400') => void
}

const initialState: IStateControllerContext = {
  headerVariant: 'midnight-950',
  setHeaderVariant: () => {},
}

export const StateControllerContext =
  createContext<IStateControllerContext>(initialState)

const StateControllerProvider = ({ children }: React.PropsWithChildren) => {
  const [headerVariant, setHeaderVariant] = useState(initialState.headerVariant)

  return (
    <StateControllerContext.Provider
      value={{
        headerVariant,
        setHeaderVariant,
      }}
    >
      {children}
    </StateControllerContext.Provider>
  )
}

export default StateControllerProvider
