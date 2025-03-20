import { UID } from '@strapi/strapi'

const BLOCK_HANDLER: Partial<Record<UID.Component, (block: any) => string>> = {
  'blocks.page-hero': (block) => {
    return block.description || ''
  },
  'blocks.rich-text': (block) => {
    return block.content || ''
  },
  'blocks-posts.text': (block) => {
    return block.content || ''
  },
}

export function getContentFromBlocks(blocks?: any[]) {
  if (!blocks) {
    return null
  }

  const contents: string[] = []

  for (const block of blocks) {
    const handler = BLOCK_HANDLER[block.__component]

    if (handler) {
      contents.push(handler(block))
    }
  }

  return contents
}
