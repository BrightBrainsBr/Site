/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import type {
  IContentPagination,
  ITreatmentFilter,
} from '@futurebrand/types/contents'
import { useCallback, useMemo, useState } from 'react'

import type {
  ITreatmentsQueryParams,
  ITreatmentsQueryResponse,
} from '~/services/treatments-query'
import { queryTreatmentsAction } from '~/services/treatments-query/action'

interface Props {
  initialState: ITreatmentsQueryResponse
  queryParams: ITreatmentsQueryParams
}

function useTreatmentsQuery({ initialState, queryParams }: Props) {
  const [pagination, setPagination] = useState<IContentPagination>(
    initialState.pagination
  )

  const [posts, setPosts] = useState(initialState.results)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const [currentFilters, setCurrentFilters] = useState<ITreatmentFilter>(
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
      const nextState = await queryTreatmentsAction({
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
      setPosts((prev: any) => [...prev, ...nextState.results])
    } catch (error) {
      console.error(error)
      setError(true)
    } finally {
      setIsLoading(false)
    }

    setIsLoading(false)
  }, [currentFilters, isLoading, pagination.page, queryParams])

  const onChangeFilter = useCallback(
    async (nextFilter: Partial<ITreatmentFilter>, mergeFilters = true) => {
      if (isLoading) return

      setIsLoading(true)

      const mergedFilters: ITreatmentFilter = mergeFilters
        ? {
            ...currentFilters,
            ...nextFilter,
          }
        : nextFilter

      setCurrentFilters(mergedFilters)
      setPosts([])

      const nextState = await queryTreatmentsAction({
        ...queryParams,
        filters: mergedFilters,
        page: 1,
      })

      setPagination(nextState.pagination)
      setPosts(nextState.results)

      setIsLoading(false)
    },
    [currentFilters, isLoading, queryParams]
  )

  return {
    pagination,
    posts,
    haveMore,
    isLoading,
    total: pagination.total,
    loadPage: onLoadPage,
    changeFilter: onChangeFilter,
  }
}

export default useTreatmentsQuery
