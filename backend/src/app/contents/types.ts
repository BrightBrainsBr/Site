export type ContentTypes =
  | 'pages'
  | 'posts'
  | 'modals'
  | 'search'
  | 'treatments'
  | 'tags'

export interface IPostFilter {
  title?: string
  tags?: string[]
}
