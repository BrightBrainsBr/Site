import type { RouterSlugs } from '@futurebrand/router'

const CONTENT_SLUGS: RouterSlugs = {
  'pt-BR': {
    posts: '/noticias/:slug',
    treatments: '/tratamento/:slug',
    modals: '/m/:slug',
    pages: '{/*path}',
  },
}

export default CONTENT_SLUGS
