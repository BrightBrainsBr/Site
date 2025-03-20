import { ContentService } from '@futurebrand/helpers-nextjs/services'
import type { ContentTypes } from '@futurebrand/types/contents'
import { unstable_noStore } from 'next/cache'
import { notFound } from 'next/navigation'

import { getHelpersRouter } from '~/hooks/get-helpers-router'
import DynamicPage from '~/layouts/pages/dynamic-page'

interface IPreviewResponse {
  data: any
  type: ContentTypes
  params: any
}

interface Props {
  searchParams: Promise<{
    token?: string
  }>
  params: Promise<{ locale: string }>
}

async function PreviewPage({ searchParams, params }: Props) {
  unstable_noStore()

  const router = await getHelpersRouter()
  const { locale } = await params
  const { token } = await searchParams

  if (!token) {
    router.setRoute({
      locale,
      slug: [],
    })
    return <DynamicPage {...router.current} />
  }

  const service = new ContentService()

  const response = await service.preview<IPreviewResponse>(String(token))

  if (!response.data) {
    notFound()
  }

  const { data, type, params: routeParams } = response

  router.setRoute({
    type,
    locale,
    params: routeParams,
  })

  return (
    <DynamicPage
      locale={locale}
      previewData={data}
      type={type}
      params={routeParams}
    />
  )
}

export default PreviewPage
