/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use server'

import { queryTreatmentsData } from './treatments-query'
import type { ITreatmentsQueryParams, ITreatmentsQueryResponse } from './types'

export async function queryTreatmentsAction(
  params: ITreatmentsQueryParams
): Promise<ITreatmentsQueryResponse> {
  try {
    return await queryTreatmentsData({
      ...params,
      isAction: true,
    })
  } catch (error) {
    console.error(error)
    return {
      error: (error as any)?.message,
    } as ITreatmentsQueryResponse
  }
}
