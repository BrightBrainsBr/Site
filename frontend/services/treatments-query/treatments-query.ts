import type { HelpersRouter } from '@futurebrand/helpers-nextjs/router'
import { ContentService } from '@futurebrand/helpers-nextjs/services'
import type { ITreatment, ITreatmentCard } from '@futurebrand/types/contents'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

import type { ITreatmentsQueryParams, ITreatmentsQueryResponse } from './types'

function sanitizeData(
  router: HelpersRouter,
  data: ITreatment[],
  { locale, isAction }: ITreatmentsQueryParams
): ITreatmentCard[] {
  return data.map((item, index) => ({
    id: item.id,
    animation: isAction ? index : false,
    title: item.title,
    excerpt: item.excerpt,
    featuredImage: item.featuredImage,
    path: router.getLocalizedPath(
      {
        slug: item.slug,
      },
      locale,
      'treatments'
    ),
  }))
}

export async function queryTreatmentsData(
  params: ITreatmentsQueryParams
): Promise<ITreatmentsQueryResponse> {
  const { filters, locale, page } = params

  const router = await getHelpersRouter()

  const service = new ContentService()

  const { pagination, results } = await service.query<ITreatment[]>({
    type: 'treatments',
    locale,
    params: {
      filters,
      page,
    },
  })

  const sanitizedResults = sanitizeData(router, results, params)

  return {
    pagination,
    results: sanitizedResults,
  }
}
