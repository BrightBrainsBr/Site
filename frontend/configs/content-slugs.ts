import type { RouterSlugs } from '@futurebrand/router'

const CONTENT_SLUGS: RouterSlugs = {
  'pt-BR': {
    posts: '/conteudo/:slug',
    modals: '/m/:slug',
    pages: '{/*path}',
  },
  en: {
    posts: '/blog/:slug',
    modals: '/m/:slug',
    pages: '{/*path}',
  },
}

export default CONTENT_SLUGS
