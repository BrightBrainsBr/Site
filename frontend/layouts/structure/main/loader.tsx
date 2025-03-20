import type {
  ContentTypes,
  ILocalization,
  ILocalizationRoute,
} from '@futurebrand/types/contents'
import React from 'react'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

import Main from './main'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  localizations?: ILocalization[]
  contentType?: ContentTypes
  pageKey?: string
}

const MainLoader: React.FC<React.PropsWithChildren<Props>> = async ({
  children,
  localizations,
  contentType,
  ...rest
}) => {
  const helperRouter = await getHelpersRouter()

  let sanitizedLocalizations: ILocalizationRoute[] | undefined = undefined

  try {
    if (localizations && contentType) {
      sanitizedLocalizations =
        await helperRouter.localization.sanitizeContentLocalization(
          localizations,
          contentType
        )
    }
  } catch {
    console.error(contentType, 'Failed to sanitize localizations')
  }

  return (
    <Main {...rest} localizations={sanitizedLocalizations}>
      {children}
    </Main>
  )
}

export default MainLoader
