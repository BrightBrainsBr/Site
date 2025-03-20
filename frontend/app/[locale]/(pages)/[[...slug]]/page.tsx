import type { IRoute } from '@futurebrand/helpers-nextjs/router'
import type { ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

import { getHelpersRouter } from '~/hooks/get-helpers-router'
import DynamicPage from '~/layouts/pages/dynamic-page'

interface Props {
  params: Promise<{ locale: string; slug: string[] }>
}

/**
 * @ISR
 * Disabled in AWS Amplify Deployment
 * If is not Amplify, you can enable it
 */
// export async function generateStaticParams() {
//   const router = await getHelpersRouter()
//   return await router.map.generateStaticPath({
//     pages: 10,
//     posts: 10,
//   })
// }

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
) {
  const paramsData = (await params) as IRoute

  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(paramsData.locale)) {
    return {}
  }
  try {
    return await router.getSEO(paramsData, parent, 600)
  } catch {
    return {}
  }
}

async function Page({ params }: Props) {
  const paramsData = (await params) as IRoute

  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(paramsData.locale)) {
    notFound()
  }

  router.setRoute(paramsData)

  return <DynamicPage {...router.current} />
}

export default Page
