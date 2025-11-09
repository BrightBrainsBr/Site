/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  type ContentClient,
  ContentModule,
} from '@futurebrand/helpers-strapi/modules'
import type { UID } from '@strapi/strapi'

import DefaultBlocksHandler from '../blocks/blocks'
import PostsBlocksHandler from '../blocks/blocks-posts'
import WrappersBlocksHandler from '../blocks/wrappers'
import type { ContentTypes, IPostFilter } from './types'

class AppContentClient implements ContentClient<ContentTypes> {
  pages: ContentModule
  modals: ContentModule
  posts: ContentModule
  podcasts: ContentModule
  searchEntry: ContentModule
  treatments: ContentModule
  tags: ContentModule

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

    /** @TAGS */
    this.tags = new ContentModule('api::tag.tag')

    this.tags.addDefaultQuery({
      pageSize: 9999,
      hasPagination: true,
      sort: {
        createdAt: 'desc',
      } as any,
    })

    /** @POSTS */
    this.posts = new ContentModule('api::post.post')

    this.posts.addDefaultSingle().addBlockHandler(PostsBlocksHandler)
    this.posts
      .addDefaultQuery<IPostFilter>({
        pageSize: 9999,
        hasPagination: true,
        sort: {
          publishedDateTime: 'desc',
        } as any,
        populate: {
          featuredImage: {
            populate: {
              desktop: true,
              mobile: true,
            },
          },
          tags: true,
        },
      })
      .onFilterEvent(async (filters?: IPostFilter) => {
        const queryFilters: any[] = []
        const filter: any = {}

        if (
          filters?.tags &&
          Array.isArray(filters?.tags) &&
          filters?.tags.length > 0
        ) {
          queryFilters.push({
            tags: {
              name: {
                $eq: filters.tags.map((tag) => tag),
              },
            },
          })
        }

        if (filters?.title) {
          queryFilters.push({
            title: {
              $ne: filters.title,
            },
          })
        }

        filter.$or = queryFilters

        return filter
      })

    /** @TREATMENTS */
    this.treatments = new ContentModule('api::treatment.treatment')

    this.treatments
      .addDefaultSingle()
      .addBlockHandler(DefaultBlocksHandler)
      .addBlockHandler(WrappersBlocksHandler)
    this.treatments.addDefaultQuery<IPostFilter>({
      pageSize: 25,
      hasPagination: true,
      sort: {
        publishedDateTime: 'desc',
      } as any,
      populate: {
        featuredImage: true,
      },
    })

    this.searchEntry = new ContentModule('api::search-entry.search-entry')

    /** @PODCASTS */
    this.podcasts = new ContentModule('api::podcast.podcast')
    this.podcasts.addDefaultQuery({
      pageSize: 25,
      hasPagination: true,
      sort: {
        publishedDate: 'desc',
      } as any,
    })

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
      await this.podcasts.register()
    await this.searchEntry.register()
    await this.treatments.register()
    await this.tags.register()
  }

  public getContentByType(type: ContentTypes) {
    console.log(`[ContentClient] getContentByType called with type: "${type}" (typeof: ${typeof type})`)
    switch (type) {
      case 'pages':
        return this.pages
      case 'modals':
        return this.modals
      case 'posts':
        return this.posts
      case 'podcasts':
        console.log('[ContentClient] Matched podcasts case, returning this.podcasts')
        return this.podcasts
      case 'search':
        return this.searchEntry
      case 'treatments':
        return this.treatments
      case 'tags':
        return this.tags
      default:
        console.error(`[ContentClient] No matching case found for type: "${type}"`)
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
      case 'api::podcast.podcast':
        return 'podcasts'
      case 'api::search-entry.search-entry':
        return 'search'
      case 'api::treatment.treatment':
        return 'treatments'
      case 'api::tag.tag':
        return 'tags'
      default:
        return null
    }
  }
}

export default AppContentClient
