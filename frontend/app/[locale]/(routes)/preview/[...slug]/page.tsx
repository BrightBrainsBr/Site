import type { ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

import { getHelpersRouter } from '~/hooks/get-helpers-router'
import DynamicPage from '~/layouts/pages/dynamic-page'

interface Props {
  params: Promise<{ locale: string; slug: string[] }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
) {
  const paramsData = await params

  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(paramsData.locale)) {
    return {}
  }
  try {
    const seo = await router.getSEO(paramsData, parent, 0)
    return {
      ...seo,
      robots: {
        index: false,
        follow: false,
      },
    }
  } catch {
    return {}
  }
}

async function Page({ params }: Props) {
  const router = await getHelpersRouter()
  const paramsData = await params

  if (!router.localization.locales.includes(paramsData.locale)) {
    notFound()
  }

  router.setRoute(paramsData)

  return <DynamicPage {...router.current} />
}

export default Page
