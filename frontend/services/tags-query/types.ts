import type {
  IContentPagination,
  IPostFilter,
  ITagCard,
} from '@futurebrand/types/contents'

export interface ITagsQueryParams {
  filters: IPostFilter
  page: number
  locale: string
  isAction?: boolean
}

export interface ITagsQueryResponse {
  pagination: IContentPagination
  results: ITagCard[]
  error?: string
}
