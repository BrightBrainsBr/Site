/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '@futurebrand/types/global-options' {
  import type { IGlobalBlock } from '@futurebrand/types/contents'
  import type {
    HTMLString,
    ISocialLinks,
    IStrapiCommonLink,
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

  // FOOTER

  export interface IFooterOptions {
    footerMenu: IStrapiCommonLink[]
    socialLink: ISocialLinks[]
    legalText: string
    address: HTMLString
    techResponsible: HTMLString
  }

  // HEADER

  interface IMenuCard {
    title: string
    description: HTMLString
    cta: IStrapiCommonLink
    image: IStrapiMedia
    layout: string
  }

  interface IHeaderMenuItem {
    item: IStrapiCommonLink
    submenuDefault: {
      items: IStrapiCommonLink[]
      card: IMenuCard
    }
    submenuTreatment: {
      cards: IMenuCard[]
    }
  }

  export interface IHeaderStructure {
    logo: IStrapiMedia
    headerMenu: IHeaderMenuItem[]
    contactLink: IStrapiCommonLink
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
