/**
 * Custom sync route
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/podcasts/sync',
      handler: 'sync.sync',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
}
