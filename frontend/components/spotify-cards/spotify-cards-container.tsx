import React from 'react'
import { twMerge } from 'tailwind-merge'

import { animate } from '@futurebrand/helpers-nextjs/utils'

import SpotifyCard from './spotify-card'
import type {
  IPodcastData,
  IPodcastRawData,
  ISpotifyCardsContainerProps,
} from './types'

const SpotifyCardsContainer: React.FC<ISpotifyCardsContainerProps> = ({
  podcasts,
  title = 'Últimos Episódios do Podcast',
  className,
}) => {
  // Limit to 3 most recent podcasts
  const latestPodcasts = podcasts.slice(0, 3)

  // Type guard to check if podcast has attributes
  const hasAttributes = (
    podcast: IPodcastData | IPodcastRawData
  ): podcast is IPodcastData => {
    return 'attributes' in podcast
  }

  if (latestPodcasts.length === 0) {
    return (
      <div className={twMerge('spotify-cards-container', className)}>
        {title && (
          <h2
            className={twMerge(
              'text-sm uppercase text-midnight-950 pb-5 lg:pb-[1.875rem] border-b mb-8',
              animate()
            )}
          >
            {title}
          </h2>
        )}
        <div className="text-center py-8">
          <p className="text-gray-600">
            Nenhum episódio disponível no momento.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={twMerge('spotify-cards-container', className)}>
      {title && (
        <h2
          className={twMerge(
            'text-sm uppercase text-midnight-950 pb-5 lg:pb-[1.875rem] border-b mb-8',
            animate()
          )}
        >
          {title}
        </h2>
      )}

      <div
        className={twMerge(
          'grid gap-6',
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          'auto-rows-fr', // Ensure equal height cards
          animate()
        )}
      >
        {latestPodcasts.map((podcast, index) => {
          // Check if data has attributes wrapper or is raw
          const normalizedPodcast: IPodcastData = hasAttributes(podcast)
            ? podcast
            : {
                id: podcast.id,
                attributes: podcast,
              }

          const spotifyId =
            normalizedPodcast.attributes.spotifyId ||
            normalizedPodcast.attributes.spotify_id ||
            normalizedPodcast.id

          return (
            <SpotifyCard
              key={String(spotifyId)}
              podcast={normalizedPodcast}
              priority={index === 0} // First card gets priority loading
            />
          )
        })}
      </div>

      {/* Show all episodes link */}
      <div className={twMerge('text-center mt-8', animate())}>
        <a
          href="https://open.spotify.com/show/27Ea3Q6N75RmWg0vyzQtCr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          Ver todos os episódios
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default SpotifyCardsContainer
