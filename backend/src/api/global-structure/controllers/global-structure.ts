/**
 * global-structure controller
 */

import { populateCollection } from '@futurebrand/helpers-strapi/utils'
import { factories } from '@strapi/strapi'

export default factories.createCoreController(
  'api::global-structure.global-structure',
  ({ strapi }) => ({
    async find(ctx) {
      const locale = String(ctx.query.locale ?? 'en')

      const options = await strapi.entityService?.findMany(
        'api::global-structure.global-structure',
        {
          locale,
          populate: populateCollection(
            'api::global-structure.global-structure',
            10
          ) as any,
        }
      )

      if (!options) {
        return ctx.notFound('Options Found')
      }

      return {
        data: {
          attributes: options,
        },
      }
    },
  })
)
