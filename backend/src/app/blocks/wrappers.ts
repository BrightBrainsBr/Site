import {
  type BlockHandleList,
  ContentBlockHandler,
} from '@futurebrand/helpers-strapi/modules'

const BLOCK_HANDLER: BlockHandleList = {}

export default new ContentBlockHandler(BLOCK_HANDLER, {
  category: 'wrappers',
})
