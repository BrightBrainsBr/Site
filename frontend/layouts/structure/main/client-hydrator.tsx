'use client'

import { useLocalizations } from '@futurebrand/hooks'
import type { ILocalizationRoute } from '@futurebrand/types/contents'
import React, { useEffect } from 'react'

import useStateController from '~/hooks/use-state-controller'

interface Props {
  localizations?: ILocalizationRoute[]
  themeVariant?:
    | 'midnight-950'
    | 'blue-400'
    | 'green-400'
    | 'lime-400'
    | 'violet-400'
}

const ClientHydrator: React.FC<Props> = ({ localizations, themeVariant }) => {
  const { setThemeVariant } = useStateController()
  const { updateRoutes } = useLocalizations()

  useEffect(() => {
    setThemeVariant(themeVariant ?? 'midnight-950')
  }, [themeVariant, setThemeVariant])

  useEffect(() => {
    updateRoutes(localizations)
  }, [localizations, updateRoutes])

  return null
}

export default ClientHydrator
