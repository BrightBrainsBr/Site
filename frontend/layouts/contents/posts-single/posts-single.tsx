import { ContentService } from '@futurebrand/services'
import type { IPost } from '@futurebrand/types/contents'
import React from 'react'

import JsonLd from '~/components/seo/JsonLd'
import BlocksLayout from '~/layouts/blocks'
import Main from '~/layouts/structure/main'

import HeadlineContact from './headline-contact'
import RelatedPosts from './related-posts'
import Title from './title'

interface Props {
  params: Record<string, string>
  locale: string
  previewData?: IPost
}

const SITE_URL = 'https://www.brightbrains.com.br'

async function PostsSingle({ locale, params, previewData }: Props) {
  const service = new ContentService()
  const pageData = await service.single<IPost>({
    type: 'posts',
    locale,
    params,
    previewData,
  })

  const cdnUrl = process.env.CDN_IMAGES_URL || ''
  const slug = pageData.slug?.replace(/^\//, '') || ''
  const pageUrl = `${SITE_URL}/${locale}/noticias/${slug}`

  // Build image URL from CMS data (if available)
  const imageUrl =
    pageData.featuredImage?.desktop?.url
      ? (pageData.featuredImage.desktop.url.startsWith('http')
          ? pageData.featuredImage.desktop.url
          : `${cdnUrl}${pageData.featuredImage.desktop.url}`)
      : undefined

  // Article schema — only includes fields that actually have data
  const articleSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pageData.title,
    url: pageUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    publisher: { '@id': `${SITE_URL}/#organization` },
    author: { '@id': `${SITE_URL}/#organization` },
  }
  if (pageData.excerpt) articleSchema.description = pageData.excerpt
  if (imageUrl) articleSchema.image = [imageUrl]
  if (pageData.publishedDateTime || pageData.publishedAt) {
    articleSchema.datePublished = pageData.publishedDateTime || pageData.publishedAt
  }
  if (pageData.updatedAt) articleSchema.dateModified = pageData.updatedAt

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Notícias',
        item: `${SITE_URL}/${locale}/noticias`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: pageData.title,
        item: pageUrl,
      },
    ],
  }

  return (
    <Main
      contentType={'posts'}
      localizations={pageData.localizations}
      // className="pt-16 lg:pt-20"
      themeVariant="lime-400"
    >
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Title
        title={pageData.title}
        description={pageData.excerpt}
        // tags={pageData.tags?.map((tag) => tag.name) || []}
        featuredImage={pageData.featuredImage}
      />
      <div className="relative z-10 flex flex-col gap-10 bg-gray-light py-10 lg:py-20">
        <BlocksLayout
          blocks={pageData.blocks}
          content={pageData}
          contentType="posts"
        />
      </div>
      <RelatedPosts locale={locale} title={pageData.title} />
      <HeadlineContact />
    </Main>
  )
}

export default PostsSingle

