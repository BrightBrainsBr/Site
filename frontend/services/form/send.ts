'use server'

import { FormService } from '@futurebrand/services'
import type { IFormResponse, ISubmitPageContext } from '@futurebrand/types/form'

const formService = new FormService()

export async function sendFormAction(
  formId: number,
  data: Record<string, unknown>,
  context: ISubmitPageContext
): Promise<IFormResponse> {
  try {
    const result = await formService.submit(formId, data, context)

    // If the CMS/Strapi returned a raw server error (e.g. an unhandled crash
    // inside the futurebrand-strapi-helpers plugin), replace the technical
    // message with a user-friendly one so raw stack traces are never exposed.
    if (
      result.error?.message &&
      /cannot read properties|undefined|\.split\(|TypeError/i.test(
        result.error.message
      )
    ) {
      console.error(
        '[sendFormAction] CMS returned a server error:',
        result.error.message
      )
      return {
        success: false,
        error: {
          ...result.error,
          message:
            'Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.',
        },
      }
    }

    return result
  } catch (err) {
    console.error('[sendFormAction] Unexpected error:', err)
    return {
      success: false,
      error: {
        validations: [],
        message:
          'Ocorreu um erro inesperado. Tente novamente mais tarde.',
        details: null,
      },
    }
  }
}
