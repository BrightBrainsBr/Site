import { AnimatedSection } from '@futurebrand/helpers-nextjs/components'
import type { IBlockProps } from '@futurebrand/types/contents'
import React from 'react'

import { SpotifyCardsWrapper } from '~/components/spotify-cards'
import type { IPodcastsQueryParams } from '~/services/podcasts-query'
import { queryPodcastsData } from '~/services/podcasts-query'

interface Properties {
  title: string
}

const BlockSpotifyPodcasts: React.FC<IBlockProps<Properties>> = async ({
  blockData,
  locale,
}) => {
  const { title, anchor } = blockData

  // Query podcasts data with comprehensive error handling
  const queryParams: IPodcastsQueryParams = {
    filters: {},
    page: 1,
    locale,
    limit: 3, // Only get 3 latest episodes
  }

  let podcastsData
  let error

  try {
    podcastsData = await queryPodcastsData(queryParams)

    // Check if the response contains an error
    if (podcastsData.error) {
      error = podcastsData.error
      podcastsData = undefined
    }
  } catch (err) {
    console.error('Error fetching podcasts in block:', err)
    error = 'Erro ao buscar episódios do podcast'
    podcastsData = undefined
  }

  return (
    <AnimatedSection
      name="block-spotify-podcasts"
      anchor={anchor}
      distance="small"
      spacing="padding"
      className="bg-gradient-to-b from-gray-light from-20% to-transparent"
    >
      <div className="container">
        <SpotifyCardsWrapper
          podcasts={podcastsData?.results}
          title={title || 'Últimos Episódios do Podcast'}
          error={error}
          isLoading={false} // Server-side rendered, so no loading state needed
        />
      </div>
    </AnimatedSection>
  )
}

export default BlockSpotifyPodcasts
