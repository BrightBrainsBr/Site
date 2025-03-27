import {
  ContentModule,
  type ContentClient,
} from '@futurebrand/helpers-strapi/modules'
import type { IPostFilter, ContentTypes } from './types'
import type { UID } from '@strapi/strapi'

import DefaultBlocksHandler from '../blocks/blocks'
import PostsBlocksHandler from '../blocks/blocks-posts'
import WrappersBlocksHandler from '../blocks/wrappers'

class AppContentClient implements ContentClient<ContentTypes> {
  pages: ContentModule
  modals: ContentModule
  posts: ContentModule
  searchEntry: ContentModule
  treatments: ContentModule

  constructor() {
    /** @PAGES */
    this.pages = new ContentModule('api::page.page')
    this.pages
      .addDefaultSingle({
        pathConfigs: [
          {
            key: 'path',
            slugify: true,
          },
        ],
      })
      .addBlockHandler(DefaultBlocksHandler)
      .addBlockHandler(WrappersBlocksHandler)

    /** @MODALS */
    this.modals = new ContentModule('api::modal.modal')
    this.modals.addDefaultSingle()

    /** @POSTS */
    this.posts = new ContentModule('api::post.post')

    this.posts.addDefaultSingle().addBlockHandler(PostsBlocksHandler)
    this.posts
      .addDefaultQuery<IPostFilter>({
        pageSize: 12,
        hasPagination: true,
        sort: {
          publishedDateTime: 'desc',
        } as any,
        populate: {
          thumbnail: true,
        },
      })
      .onFilterEvent(async (filters?: IPostFilter) => {
        if (
          filters?.tags &&
          Array.isArray(filters.tags) &&
          filters.tags.length > 0
        ) {
          return {
            tags: filters.tags.map((tag) => Number(tag)),
          }
        }

        return {}
      })

    /** @TREATMENTS */
    this.treatments = new ContentModule('api::treatment.treatment')

    this.treatments
      .addDefaultSingle()
      .addBlockHandler(DefaultBlocksHandler)
      .addBlockHandler(WrappersBlocksHandler)
    this.treatments.addDefaultQuery<IPostFilter>({
      pageSize: 6,
      hasPagination: true,
      sort: {
        publishedDateTime: 'desc',
      } as any,
      populate: {
        featuredImage: true,
      },
    })

    this.searchEntry = new ContentModule('api::search-entry.search-entry')

    this.searchEntry
      .addDefaultQuery<IPostFilter>({
        pageSize: 12,
        hasPagination: true,
        sort: {
          publishedDateTime: 'desc',
        } as any,
        populate: {
          thumbnail: true,
        },
      })
      .onFilterEvent(async (filters?: any) => {
        if (filters.term) {
          return {
            content: {
              $containsi: filters.term,
            },
          }
        }

        return {}
      })
  }

  public async register() {
    await this.pages.register()
    await this.modals.register()
    await this.posts.register()
    await this.searchEntry.register()
    await this.treatments.register()
  }

  public getContentByType(type: ContentTypes) {
    switch (type) {
      case 'pages':
        return this.pages
      case 'modals':
        return this.modals
      case 'posts':
        return this.posts
      case 'search':
        return this.searchEntry
      case 'treatments':
        return this.treatments
      default:
        throw new Error(`Invalid content type: ${type as string}`)
    }
  }

  public async getContentTypeByID(
    api: UID.ContentType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    documentId: string
  ): Promise<ContentTypes | null> {
    switch (api) {
      case 'api::page.page':
        return 'pages'
      case 'api::modal.modal':
        return 'modals'
      case 'api::post.post':
        return 'posts'
      case 'api::search-entry.search-entry':
        return 'search'
      case 'api::treatment.treatment':
        return 'treatments'
      default:
        return null
    }
  }
}

export default AppContentClient
