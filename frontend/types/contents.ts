declare module '@futurebrand/types/contents' {
  import type { IForm } from '@futurebrand/types/form'
  import type {
    HTMLString,
    IDynamicZoneComponent,
    IStrapiDataComponentList,
    IStrapiMedia,
  } from '@futurebrand/types/strapi'
  import type { PropsWithChildren } from 'react'

  export type ContentTypes = 'pages' | 'posts' | 'modals'

  // BLOCKS

  export type IBlockData<T = unknown> = IDynamicZoneComponent & {
    anchor?: string
  } & T

  export interface IBlockProps<T> {
    blockData: IBlockData<T>
    content?: IPageWithBlocks
    contentType?: ContentTypes
    locale: string
    lcp?: boolean
  }

  export interface IWrapperBlock<T> {
    type: 'wrapper'
    blockKey: string
    data: T
    lcp: boolean
    blocks: Array<IBlock<T>>
    layer: number
  }

  export interface IWrappedBlock<T> {
    type: 'block'
    blockKey: string
    data: T
    lcp: boolean
    layer: number
  }

  export type IBlock<T> = IWrapperBlock<T> | IWrappedBlock<T>

  export type IWrapperProps<T> = PropsWithChildren<IBlockProps<T>>

  // LOCALIZATION

  export interface ILocalization {
    id: number
    locale: string
    params: any
  }

  export interface ILocalizationRoute {
    path: string
    locale: string
  }

  export type ILocalizationData = IStrapiDataComponentList<ILocalization>

  // SEO

  export interface IPageSeo {
    metaTitle: string
    metaDescription: string
    metaImage?: IStrapiMedia
    showOnGoogle: boolean
    redirect?: {
      enabled: boolean
      url: string
    }
  }

  // CONTENT BASE

  interface IContent {
    id: number
    pageSeo: IPageSeo
    slug: string
    locale: string
    createdAt: string
    updatedAt: string
    publishedAt: string
    localizations: ILocalization[]
  }

  // PAGINATION

  export interface IContentPagination {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }

  export interface IContentResponse<T> {
    results: T
    pagination: IContentPagination
  }

  export interface IPageWithBlocks extends IContent {
    blocks: IBlockData[]
  }

  /** @GLOBAL_BLOCKS */

  export interface IGlobalBlock extends IContent {
    blocks: IBlockData[]
  }

  /** @PAGES */

  export interface IPageData extends IPageWithBlocks {
    path: string
    headerColor?: 'midnight-950' | 'blue-400' | 'green-400' | 'lime-400' | 'violet-400'
  }

  /** @MODALS */

  export interface IModalContent {
    id: number
    form?: IForm
    title?: string
    description?: HTMLString
    requiredText?: string
  }

  export interface IModal extends IContent, IModalContent {}

  /** @POSTS */

  // TAG

  export interface ITag {
    id: number
    name: string
    slug: string
  }

  export interface IPost extends IPageWithBlocks {
    title: string
    excerpt: string
    thumbnail: IStrapiMedia
    tags?: ITag[]
    publishedDateTime: string
  }

  export interface IPostCard {
    id: number
    title: string
    excerpt: string
    tags: string[]
    thumbnail?: IStrapiMedia
    path: string
    animation: number | false
  }

  export interface IPostFilter {
    tags?: number[]
  }
}
