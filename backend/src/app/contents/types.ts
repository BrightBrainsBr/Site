export type ContentTypes =
  | 'pages'
  | 'posts'
  | 'modals'
  | 'search'
  | 'treatments'

export interface IPostFilter {
  tags?: number[]
}
