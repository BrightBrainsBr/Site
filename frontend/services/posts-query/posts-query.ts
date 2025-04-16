import type { HelpersRouter } from '@futurebrand/helpers-nextjs/router'
import { ContentService } from '@futurebrand/helpers-nextjs/services'
import type { IPost, IPostCard } from '@futurebrand/types/contents'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

import type { IPostsQueryParams, IPostsQueryResponse } from './types'

function sanitizeData(
  router: HelpersRouter,
  data: IPost[],
  { locale, isAction }: IPostsQueryParams
): IPostCard[] {
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
      'posts'
    ),
  }))
}

export async function queryPostsData(
  params: IPostsQueryParams
): Promise<IPostsQueryResponse> {
  const { filters, locale, page } = params

  const router = await getHelpersRouter()

  const service = new ContentService()

  const { pagination, results } = await service.query<IPost[]>({
    type: 'posts',
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
