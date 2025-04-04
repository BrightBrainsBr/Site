'use client'

import { useLocalizations } from '@futurebrand/hooks'
import type { ILocalizationRoute } from '@futurebrand/types/contents'
import React, { useEffect } from 'react'

import useStateController from '~/hooks/use-state-controller'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  localizations?: ILocalizationRoute[]
  themeVariant?:
    | 'midnight-950'
    | 'blue-400'
    | 'green-400'
    | 'lime-400'
    | 'violet-400'
}

const PageMain: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  localizations,
  className,
  themeVariant,
  ...rest
}) => {
  const { setThemeVariant } = useStateController()
  const { updateRoutes } = useLocalizations()

  useEffect(() => {
    setThemeVariant(themeVariant ?? 'midnight-950')
  }, [themeVariant, setThemeVariant])

  useEffect(() => {
    updateRoutes(localizations)
  }, [localizations, updateRoutes])

  return (
    <main className={`block min-h-screen ${className ?? ''}`} {...rest}>
      {children}
    </main>
  )
}

export default PageMain
