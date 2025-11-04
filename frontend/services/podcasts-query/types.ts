import type { IContentPagination } from '@futurebrand/types/contents'

import type { IPodcastData } from '~/components/spotify-cards'

export interface IPodcastFilter {
  // Add filter types as needed
  search?: string
  publishedDate?: {
    $gte?: string
    $lte?: string
  }
}

export interface IPodcastsQueryParams {
  filters: IPodcastFilter
  page: number
  locale: string
  limit?: number
  isAction?: boolean
}

export interface IPodcastsQueryResponse {
  pagination: IContentPagination
  results: IPodcastData[]
  error?: string
}
