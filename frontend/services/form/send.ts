'use server'

import { FormService } from '@futurebrand/services'
import type { IFormResponse, ISubmitPageContext } from '@futurebrand/types/form'

const formService = new FormService()

export async function sendFormAction(
  formId: number,
  data: Record<string, unknown>,
  context: ISubmitPageContext
): Promise<IFormResponse> {
  return await formService.submit(formId, data, context)
}
