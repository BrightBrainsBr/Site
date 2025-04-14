/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBlocksComponents } from '@futurebrand/layouts'

const BLOCKS: Record<string, any> = {
  'archive-treatments': async () => await import('./block-archive-treatments'),
  'brain-image-map': async () => await import('./block-brain-image-map'),
  benefits: async () => await import('./block-benefits'),
  depositions: async () => await import('./block-depositions'),
  faq: async () => await import('./block-faq'),
  'form-partnership': async () => await import('./block-form-partnership'),
  'image-slider': async () => await import('./block-image-slider'),
  'headline-contact': async () => await import('./block-headline-contact'),
  'headline-posts': async () => await import('./block-headline-posts'),
  'main-hero': async () => await import('./block-main-hero'),
  'media-text': async () => await import('./block-media-text'),
  'medium-hero': async () => await import('./block-medium-hero'),
  'neuro-types': async () => await import('./block-neuro-types'),
  team: async () => await import('./block-team'),
  'treatment-guide': async () => await import('./block-treatment-guide'),
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
