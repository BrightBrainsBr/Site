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
    const seo = await router.getSEO(paramsData, parent, 600)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.brightbrains.com.br'

    // Resolve slug path accurately
    const originalParams = await params
    const path = originalParams.slug ? `/${originalParams.slug.join('/')}` : ''
    const absoluteUrl = `${siteUrl}/${paramsData.locale}${path}`

    const title = seo?.title || 'Bright Brains - Instituto da Mente'
    const description =
      seo?.description ||
      'Clínica especializada em neuromodulação não invasiva aplicada à saúde mental e neurológica.'

    return {
      ...seo,
      title,
      description,
      alternates: {
        canonical: absoluteUrl,
        languages: {
          'pt-BR': `${siteUrl}/pt-BR${path}`,
          en: `${siteUrl}/en${path}`,
          'x-default': `${siteUrl}/pt-BR${path}`,
        },
      },
      openGraph: {
        title,
        description,
        url: absoluteUrl,
        siteName: 'Bright Brains',
        locale: paramsData.locale,
        type: 'website',
        ...(seo.openGraph || {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(seo.twitter || {}),
      },
    }
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
