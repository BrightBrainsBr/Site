import type { ILocalizationRoute } from '@futurebrand/types/contents'
import React from 'react'

import ClientHydrator from './client-hydrator'

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
  return (
    <main className={`block min-h-screen ${className ?? ''}`} {...rest}>
      <ClientHydrator localizations={localizations} themeVariant={themeVariant} />
      {children}
    </main>
  )
}

export default PageMain
