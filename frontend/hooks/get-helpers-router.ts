'use server'

import type { HelpersRouter } from '@futurebrand/router'
import { getRouterInstance } from '@futurebrand/router'

import CONTENT_SLUGS from '~/configs/content-slugs'

export async function getHelpersRouter(): Promise<HelpersRouter> {
  return await getRouterInstance({
    slugs: CONTENT_SLUGS,
  })
}
