'use server'

import { cmsApi } from '@futurebrand/services'
import type { IStrapiMedia } from '@futurebrand/types/strapi'
import { getCMSMediaUrl } from '@futurebrand/utils'

export async function uploadFileAction(
  formData: FormData
): Promise<string | false> {
  try {
    const response = await cmsApi().post<IStrapiMedia[]>('/upload', {
      body: formData,
    })

    if (response.data.length === 0) {
      throw new Error('No data returned')
    }

    if (process.env.NODE_ENV === 'development') {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    const data = response.data[0]

    return getCMSMediaUrl(data.url)
  } catch (error) {
    console.error(error)
    return false
  }
}
