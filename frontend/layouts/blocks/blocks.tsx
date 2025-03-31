import { createBlocksComponents } from '@futurebrand/layouts'

const BLOCKS: Record<string, any> = {
  'main-hero': async () => await import('./block-main-hero'),
  'benefits': async () => await import('./block-benefits'),
  'posts.image': async () => await import('./posts-image'),
  'posts.text': async () => await import('./posts-text'),
  'posts.button': async () => await import('./posts-button'),
  'posts.video': async () => await import('./posts-video'),
}

const WRAPPERS: Record<string, any> = {
  background: async () => await import('./wrapper-backgroud'),
  join: async () => await import('./wrapper-join'),
}

export default createBlocksComponents({
  blocks: BLOCKS,
  wrappers: WRAPPERS,
})
