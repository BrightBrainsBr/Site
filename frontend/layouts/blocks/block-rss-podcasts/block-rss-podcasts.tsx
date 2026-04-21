import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import { animate } from '@futurebrand/helpers-nextjs/utils'
import type { IBlockProps } from '@futurebrand/types/contents'
import React, { Suspense } from 'react'
import { twMerge } from 'tailwind-merge'

import CarouselContent from './carousel-content'

// Utility para buscar e transformar RSS nativamente
async function fetchRssEpisodes() {
  try {
    const res = await fetch('https://anchor.fm/s/10a07d4dc/podcast/rss', {
      next: { revalidate: 3600 },
    })
    const xml = await res.text()

    if (!xml.includes('<item>')) return []

    // Fatiar XML nos itens. O primeiro índice (0) geralmente é o channel info
    const itemBlocks = xml.split('<item>').slice(1, 7) // Pegar últimos 6 episódios

    return itemBlocks.map((item) => {
      // Usar regex match pra capturar CDATA ou texto limpo
      const titleMatch =
        item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
        item.match(/<title>([\s\S]*?)<\/title>/)
      const descMatch =
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
        item.match(/<description>([\s\S]*?)<\/description>/)
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/)
      const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)

      const title = titleMatch ? titleMatch[1].trim() : ''
      // Limpar tags HTML do conteúdo da descrição e reter só o primeiro parágrafo
      const rawDesc = descMatch ? descMatch[1].trim() : ''
      const description = rawDesc.replace(/<[^>]*>?/gm, '').trim()

      const link = linkMatch ? linkMatch[1].trim() : ''
      const date = dateMatch ? new Date(dateMatch[1].trim()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

      // Extrair ID do Spotify se tiver URL nativa do open.spotify
      let embedUrl = ''
      if (link.includes('open.spotify.com/episode/')) {
        const id = link.split('open.spotify.com/episode/')[1].split('?')[0]
        embedUrl = `https://open.spotify.com/embed/episode/${id}`
      }
      // Tratar links nativos do podcasters.spotify (Anchor)
      else if (link.includes('podcasters.spotify.com/pod/show/') && link.includes('/episodes/')) {
        embedUrl = link.replace('/episodes/', '/embed/episodes/')
      }

      return { title, description, link, date, embedUrl }
    })
  } catch (error) {
    console.error('Falha ao carregar RSS de Podcast', error)
    return []
  }
}

const BlockRssPodcasts: React.FC<IBlockProps<any>> = async ({
  blockData,
}) => {
  const { anchor } = blockData || {}
  const episodes = await fetchRssEpisodes()

  if (episodes.length === 0) return null

  return (
    <AnimatedSection
      name="block-rss-podcasts"
      anchor={anchor}
      spacing="padding"
      distance="small"
      className="overflow-hidden bg-gray-light"
    >
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 gap-4">
          <div className="max-w-2xl">
            <h2
              className={twMerge(
                'heading-4xl text-midnight-950 mb-3',
                animate()
              )}
            >
              Podcast Bright Brains
            </h2>
            <p
              className={twMerge('body-lg text-gray-500', animate({ index: 1 }))}
            >
              Conteúdos sobre saúde mental, neuromodulação e bem-estar.
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        <Suspense
          fallback={
            <div className="w-full h-48 animate-pulse bg-gray-200 rounded-lg"></div>
          }
        >
          <div className={animate({ index: 2 })}>
            <CarouselContent episodes={episodes} />
          </div>
        </Suspense>
      </div>
    </AnimatedSection>
  )
}

export default BlockRssPodcasts
