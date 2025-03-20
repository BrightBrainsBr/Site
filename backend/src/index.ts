/* eslint-disable @typescript-eslint/no-unused-vars */
'use strict'

import type { Core } from '@strapi/strapi'
import App from './app'

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */

  async register({ strapi }: { strapi: Core.Strapi }) {
    const app = new App()
    await app.instantiate(strapi)
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {},
}
