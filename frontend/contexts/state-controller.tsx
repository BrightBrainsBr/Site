'use client'

import React, { createContext, useState } from 'react'

interface IStateControllerContext {
  themeVariant:
    | 'midnight-950'
    | 'blue-400'
    | 'green-400'
    | 'lime-400'
    | 'violet-400'
  setThemeVariant: (
    variant:
      | 'midnight-950'
      | 'blue-400'
      | 'green-400'
      | 'lime-400'
      | 'violet-400'
  ) => void
}

const initialState: IStateControllerContext = {
  themeVariant: 'midnight-950',
  setThemeVariant: () => {},
}

export const StateControllerContext =
  createContext<IStateControllerContext>(initialState)

const StateControllerProvider = ({ children }: React.PropsWithChildren) => {
  const [themeVariant, setThemeVariant] = useState(initialState.themeVariant)

  return (
    <StateControllerContext.Provider
      value={{
        themeVariant,
        setThemeVariant,
      }}
    >
      {children}
    </StateControllerContext.Provider>
  )
}

export default StateControllerProvider
