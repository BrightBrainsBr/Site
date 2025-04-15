export type ContentTypes =
  | 'pages'
  | 'posts'
  | 'modals'
  | 'search'
  | 'treatments'
  | 'tags'

export interface IPostFilter {
  tags?: string[]
}
