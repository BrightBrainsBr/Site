import type {
  IContentPagination,
  IPostFilter,
} from '@futurebrand/types/contents'
import { useCallback, useMemo, useState } from 'react'

import type {
  ITagsQueryParams,
  ITagsQueryResponse,
} from '~/services/tags-query'
import { queryTagsAction } from '~/services/tags-query/action'

interface Props {
  initialState: ITagsQueryResponse
  queryParams: ITagsQueryParams
}

function useTagsQuery({ initialState, queryParams }: Props) {
  const [pagination, setPagination] = useState<IContentPagination>(
    initialState.pagination
  )

  const [tags, setTags] = useState(initialState.results)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const [currentFilters, setCurrentFilters] = useState<IPostFilter>(
    queryParams.filters
  )

  const haveMore = useMemo(
    () => !error && pagination.page < pagination.pageCount,
    [pagination, error]
  )

  const onLoadPage = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)

    const nextPage = pagination.page + 1

    try {
      const nextState = await queryTagsAction({
        ...queryParams,
        filters: currentFilters,
        page: nextPage,
      })

      if (!nextState.pagination) {
        throw new Error('No pagination found')
      }
      setPagination(nextState.pagination)

      if (!nextState.results || nextState.results.length === 0) {
        throw new Error('No results found')
      }
      setTags((prev) => [...prev, ...nextState.results])
    } catch (error) {
      console.error(error)
      setError(true)
    } finally {
      setIsLoading(false)
    }

    setIsLoading(false)
  }, [currentFilters, isLoading, pagination.page, queryParams])

  const onChangeFilter = useCallback(
    async (nextFilter: Partial<IPostFilter>, mergeFilters = true) => {
      if (isLoading) return

      setIsLoading(true)

      const mergedFilters: IPostFilter = mergeFilters
        ? {
            ...currentFilters,
            ...nextFilter,
          }
        : nextFilter

      setCurrentFilters(mergedFilters)
      setTags([])

      const nextState = await queryTagsAction({
        ...queryParams,
        filters: mergedFilters,
        page: 1,
      })

      setPagination(nextState.pagination)
      setTags(nextState.results)

      setIsLoading(false)
    },
    [currentFilters, isLoading, queryParams]
  )

  return {
    pagination,
    tags,
    haveMore,
    isLoading,
    total: pagination.total,
    loadPage: onLoadPage,
    changeFilter: onChangeFilter,
  }
}

export default useTagsQuery
