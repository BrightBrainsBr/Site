import { SlugPathGenerator } from '@futurebrand/helpers-strapi/modules'

const generator = new SlugPathGenerator('api::page.page', {
  children: 'children',
  parent: 'parent',
  slug: 'slug',
  path: 'path',
})

export default generator.getEvents()

// If you want to add custom lifecycle events, you can do so like this:
// export default {
//   ...generator.getEvents(),
//   beforeUpdate: async (ctx) => {
//     const path = await generator.execute(ctx)
//     if (path) {
//       ctx.params.data.path = path
//     }
//   },
//   afterCreate: async (ctx) => {
//     console.log('beforeCreate', inspect(ctx, false, null, true))
//   },
// }
