/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

'use server'

import { queryTagsData } from './tags-query'
import type { ITagsQueryParams, ITagsQueryResponse } from './types'

export async function queryTagsAction(
  params: ITagsQueryParams
): Promise<ITagsQueryResponse> {
  try {
    return await queryTagsData({
      ...params,
      isAction: true,
    })
  } catch (error) {
    console.error(error)
    return {
      error: (error as any)?.message,
    } as ITagsQueryResponse
  }
}
