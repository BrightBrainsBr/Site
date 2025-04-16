import { ContentService } from '@futurebrand/helpers-nextjs/services'
import type { ITag, ITagCard } from '@futurebrand/types/contents'

import type { ITagsQueryParams, ITagsQueryResponse } from './types'

function sanitizeData(data: ITag[]): ITagCard[] {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
  }))
}

export async function queryTagsData(
  params: ITagsQueryParams
): Promise<ITagsQueryResponse> {
  const { filters, locale, page } = params

  const service = new ContentService()

  const { pagination, results } = await service.query<ITag[]>({
    type: 'tags',
    locale,
    params: {
      filters,
      page,
    },
  })

  const sanitizedResults = sanitizeData(results)

  return {
    pagination,
    results: sanitizedResults,
  }
}
