declare module '@futurebrand/types/strapi' {
  import { type IFetchResponse } from '@futurebrand/modules/fetcher'

  export type HTMLString = string

  export interface IStrapiComponent<T> {
    id: number
    attributes: T
  }

  export interface IStrapiDataComponent<T> {
    data: IStrapiComponent<T>
  }

  export interface IStrapiNullnableMDataComponent<T> {
    data?: IStrapiComponent<T>
  }

  export interface IStrapiDataComponentList<T> {
    data: Array<IStrapiComponent<T>>
  }

  export type ApiResponse<T> = IFetchResponse<IStrapiDataComponent<T>>
  export type ApiListResponse<T> = IFetchResponse<
    Array<IStrapiDataComponent<T>>
  >

  export interface IStrapiMediaAttributes {
    id: number
    placeholder?: `data:image/${string}`
    url: string
    alternativeText: string
    width: number
    height: number
    mime: string
    name: string
    caption: string
  }

  export type IStrapiMedia = IStrapiMediaAttributes
  export type IStrapiMediaList =
    IStrapiDataComponentList<IStrapiMediaAttributes>
  export type IStrapiNullnableMedia =
    IStrapiNullnableMDataComponent<IStrapiMediaAttributes>

  export interface IResponsiveImage {
    desktop: IStrapiMedia
    mobile: IStrapiMedia
  }

  export interface ISocialLinks {
    id: number
    type: string
    label: string
    url: string
  }

  export interface IStrapiCommonLink {
    id: number
    text: string
    url: string
    blank: boolean
  }

  export type IButtonVariant =
    | 'midnight-950'
    | 'blue-400'
    | 'green-400'
    | 'lime-400'
    | 'violet-400'

  export interface IStrapiButton {
    id: number
    variant: IButtonVariant
    text: string
  }

  export interface IStrapiTitle {
    text: string
    htmlTag: string
  }

  export interface IStrapiVideo {
    title: string
    className?: string
    uploadedVideo?: IStrapiMedia
    youtubeVideo?: string
    thumbnail: IStrapiMedia
  }

  export interface IStrapiLinkButton extends IStrapiButton {
    url: string
    blank?: boolean
    download?: boolean
  }

  export interface IDynamicZoneComponent {
    id: number
    __component: string
  }
}
