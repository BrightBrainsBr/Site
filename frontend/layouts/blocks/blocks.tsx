/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBlocksComponents } from '@futurebrand/layouts'

const BLOCKS: Record<string, any> = {
  'archive-treatments': async () => await import('./block-archive-treatments'),
  'headline-contact': async () => await import('./block-headline-contact'),
  'headline-posts': async () => await import('./block-headline-posts'),
  'main-hero': async () => await import('./block-main-hero'),
  'media-text': async () => await import('./block-media-text'),
  'medium-hero': async () => await import('./block-medium-hero'),
  'neuro-types': async () => await import('./block-neuro-types'),
  benefits: async () => await import('./block-benefits'),
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
