import type {
  IContentPagination,
  IPostCard,
  IPostFilter,
} from '@futurebrand/types/contents'

export interface IPostsQueryParams {
  filters: IPostFilter
  page: number
  locale: string
  isAction?: boolean
}

export interface IPostsQueryResponse {
  pagination: IContentPagination
  results: IPostCard[]
  error?: string
}
