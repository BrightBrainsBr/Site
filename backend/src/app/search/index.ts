import {
  type IMultiRelationEntity,
  type MultiRelationHandler,
  MultiRelationModule,
} from '@futurebrand/helpers-strapi/modules'
import { getContentFromBlocks } from './blocks'

export interface ISearchEntry extends IMultiRelationEntity {
  title: string
  excerpt: string
  slug: string
  locale: string
  thumbnail?: any
  content: string
}

function handleSearchContent(values: Array<any | any[]>, locale: string) {
  const content: string[] = []

  for (const value of values) {
    if (value != null && value !== '' && value !== false) {
      if (Array.isArray(value)) {
        const innerValues = handleSearchContent(value, locale)
        content.push(innerValues)
      } else if (typeof value === 'string') {
        content.push(value)
      } else {
        content.push(JSON.stringify(value))
      }
    }
  }

  return content
    .join(' ')
    .toLocaleLowerCase(locale)
    .replace(/<[^>]*>?/gm, '')
}

const HANDLER: MultiRelationHandler<ISearchEntry> = {
  'api::page.page': async (entry, data) => {
    // If the function return false, the entry will be ignored
    if (!data.title) {
      return false
    }

    return {
      ...entry,
      title: data.title,
      excerpt: data.excerpt,
      slug: data.path,
      locale: data.locale,
      content: handleSearchContent(
        [data.title, data.excerpt, getContentFromBlocks(data.blocks)],
        data.locale
      ),
    }
  },
  'api::post.post': async (entry, data) => {
    return {
      ...entry,
      title: data.title,
      excerpt: data.excerpt,
      slug: data.slug,
      thumbnail: data.thumbnail,
      locale: data.locale,
      content: handleSearchContent(
        [data.title, data.excerpt, getContentFromBlocks(data.blocks)],
        data.locale
      ),
    }
  },
}

export async function createSearchRelation() {
  const relationModule = new MultiRelationModule<ISearchEntry>({
    uid: 'api::search-entry.search-entry',
    contents: ['api::page.page', 'api::post.post'],
    handler: HANDLER,
  })
  await relationModule.register()
}
