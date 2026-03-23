import type { ResolvingMetadata } from 'next'

import { getHelpersRouter } from '~/hooks/get-helpers-router'
import ContactsLayout from '~/layouts/contents/contacts'
import ContentModalWrapper from '~/layouts/structure/content-wrappers'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
) {
  const { locale, ...modalParams } = (await params) as {
    locale: string
    slug: string
  }

  const router = await getHelpersRouter()
  if (!router.localization.locales.includes(locale)) {
    return {}
  }
  try {
    return await router.getSEO(
      {
        locale,
        params: modalParams,
        type: 'modals',
      },
      parent,
      600
    )
  } catch {
    return {}
  }
}

async function Page({ params }: Props) {
  const { locale, ...modalParams } = (await params) as {
    locale: string
    slug: string
  }

  const router = await getHelpersRouter()
  router.setRoute({
    locale,
    params: modalParams,
    type: 'modals',
  })

  const key = `contacts-${modalParams.slug.replace(/\//g, '-')}`

  return (
    <ContentModalWrapper.Page modalKey={key}>
      <ContactsLayout.Modal params={modalParams} locale={locale} />
    </ContentModalWrapper.Page>
  )
}

export default Page
