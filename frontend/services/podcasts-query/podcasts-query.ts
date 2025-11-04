import { ContentService } from '@futurebrand/helpers-nextjs/services'
import type { IPodcastData } from '~/components/spotify-cards'

import type { IPodcastsQueryParams, IPodcastsQueryResponse } from './types'

function sanitizeData(
  data: IPodcastData[],
  { isAction }: IPodcastsQueryParams
): IPodcastData[] {
  return data.map((item, index) => ({
    ...item,
    // Add animation index if this is an action (user interaction)
    animationIndex: isAction ? index : undefined,
  }))
}

export async function queryPodcastsData(
  params: IPodcastsQueryParams
): Promise<IPodcastsQueryResponse> {
  const { filters, locale, page, limit = 3 } = params

  try {
    const service = new ContentService()

    const { pagination, results } = await service.query<IPodcastData[]>({
      type: 'podcasts' as any, // Type assertion for custom content type
      locale,
      params: {
        filters,
        page,
      },
    })

    const sanitizedResults = sanitizeData(results, params)

    return {
      pagination,
      results: sanitizedResults,
    }
  } catch (error) {
    console.error('Error querying podcasts:', error)
    
    return {
      pagination: {
        page: 1,
        pageSize: limit,
        pageCount: 0,
        total: 0,
      },
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}