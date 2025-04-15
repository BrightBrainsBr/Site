/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

'use server'

import { queryPostsData } from './posts-query'
import type { IPostsQueryParams, IPostsQueryResponse } from './types'

export async function queryPostsAction(
  params: IPostsQueryParams
): Promise<IPostsQueryResponse> {
  try {
    return await queryPostsData({
      ...params,
      isAction: true,
    })
  } catch (error) {
    console.error(error)
    return {
      error: (error as any)?.message,
    } as IPostsQueryResponse
  }
}
