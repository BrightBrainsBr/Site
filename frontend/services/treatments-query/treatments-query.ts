import type { HelpersRouter } from '@futurebrand/helpers-nextjs/router'
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
  const { filters, locale, page, pageSize = 25 } = params

  const router = await getHelpersRouter()

  const baseUrl = process.env.CMS_BASE_URL
  const token = process.env.CMS_FRONTEND_TOKEN

  if (!token) {
    throw new Error('CMS_FRONTEND_TOKEN is not configured')
  }

  const urlParams = new URLSearchParams({
    locale,
    populate: '*',
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
  })

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      urlParams.append(`filters[${key}]`, value.toString())
    }
  })

  const url = `${baseUrl}/api/treatments?${urlParams.toString()}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch treatments: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const sanitizedResults = sanitizeData(router, data.data, params)

  return {
    pagination: {
      page: data.meta.pagination.page.toString(),
      pageSize: data.meta.pagination.pageSize,
      pageCount: data.meta.pagination.pageCount,
      total: data.meta.pagination.total,
    },
    results: sanitizedResults,
  }
}
