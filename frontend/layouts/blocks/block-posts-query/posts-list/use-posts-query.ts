import type { IContentPagination } from '@futurebrand/types/contents'
import { useCallback, useMemo, useState } from 'react'

import type {
  IPostsQueryParams,
  IPostsQueryResponse,
} from '~/services/posts-query'
import { queryPostsAction } from '~/services/posts-query/action'

interface Props {
  initialState: IPostsQueryResponse
  queryParams: IPostsQueryParams
}

function usePostsQuery({ initialState, queryParams }: Props) {
  const [pagination, setPagination] = useState<IContentPagination>(
    initialState.pagination
  )

  const [posts, setPosts] = useState(initialState.results)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const haveMore = useMemo(
    () => !error && pagination.page < pagination.pageCount,
    [pagination, error]
  )

  const onLoadPage = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)

    const nextPage = pagination.page + 1

    try {
      const nextState = await queryPostsAction({
        ...queryParams,
        page: nextPage,
      })

      if (!nextState.pagination) {
        throw new Error('No pagination found')
      }
      setPagination(nextState.pagination)

      if (!nextState.results || nextState.results.length === 0) {
        throw new Error('No results found')
      }
      setPosts((prev) => [...prev, ...nextState.results])
    } catch (error) {
      console.error(error)
      setError(true)
    } finally {
      setIsLoading(false)
    }

    setIsLoading(false)
  }, [isLoading, pagination.page, queryParams])

  return {
    pagination,
    posts,
    haveMore,
    isLoading,
    total: pagination.total,
    loadPage: onLoadPage,
  }
}

export default usePostsQuery
