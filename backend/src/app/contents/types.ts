export type ContentTypes =
  | 'pages'
  | 'posts'
  | 'modals'
  | 'search'
  | 'treatments'
  | 'tags'
  | 'podcasts'

export interface IPostFilter {
  title?: string
  tags?: string[]
}
