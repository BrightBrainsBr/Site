'use client'

import { useLocalizations } from '@futurebrand/hooks'
import type { ILocalizationRoute } from '@futurebrand/types/contents'
import React, { useEffect } from 'react'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  localizations?: ILocalizationRoute[]
  headerVariant?: 'default' | 'blue'
}

const PageMain: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  localizations,
  className,
  headerVariant,
  ...rest
}) => {
  const { updateRoutes } = useLocalizations()

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
