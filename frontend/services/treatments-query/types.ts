import type {
  IContentPagination,
  ITreatmentCard,
  ITreatmentFilter,
} from '@futurebrand/types/contents'

export interface ITreatmentsQueryParams {
  filters: ITreatmentFilter
  page: number
  locale: string
  isAction?: boolean
}

export interface ITreatmentsQueryResponse {
  pagination: IContentPagination
  results: ITreatmentCard[]
  error?: string
}
