declare module '@futurebrand/types/global-options' {
  import { IGlobalBlock } from '@futurebrand/types/contents'
  import type {
    ISocialLinks,
    IStrapiCommonLink,
    IStrapiLinkButton,
    IStrapiMedia,
  } from '@futurebrand/types/strapi'

  /** @GLOBAL */
  export interface IGlobalData {
    options: IGlobalOptions
    structure: IGlobalStructure
    blocks: IGlobalBlock[]
  }

  // GLOBAL OPTIONS

  export interface IGlobalOptions {
    dictionary: IDictionary
    notFound: INotFoundOptions
  }

  export interface INotFoundOptions {
    title: any
    description: any
  }

  export interface IGlobalSEO {
    metaTitle: string
    metaDescription: string
    metaImage: IStrapiMedia
    siteName: string
    themeColor: string
    customMetas: Array<{ name: string; content: string }>
  }

  export interface IDictionary {
    seeMore: string
    learnMore: string
    loadMore: string
    goBack: string
  }

  // GLOBAL STRUCUTRE

  export interface IGlobalStructure {
    menu: IHeaderMenu[]
    footer: IFooterOptions
    header: IHeaderStructure
  }

  export interface IFooterOptions {
    socialLink: ISocialLinks[]
    legalText: string
  }

  export interface IHeaderStructure {
    logo: IStrapiMedia
    headerButtons: IStrapiLinkButton[]
  }

  /** @COMPONENTS */

  export interface IHeaderlink extends IStrapiCommonLink {
    __component: 'common.link'
  }

  export interface IMenuSimple {
    id: number
    __component: 'menu.simple-menu'
    name: string
    subLinks: IStrapiCommonLink[]
  }

  export type IHeaderMenu = IHeaderlink | IMenuSimple
}
