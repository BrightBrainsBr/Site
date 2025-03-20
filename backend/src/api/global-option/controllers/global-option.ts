'use strict'

/**
 * global-option controller
 */

import { factories } from '@strapi/strapi'
// import { getRegionTimezones } from '../../../modules/timezones'

export default factories.createCoreController(
  'api::global-option.global-option'
)
