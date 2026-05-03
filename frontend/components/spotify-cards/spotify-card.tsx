import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type { ISpotifyCard } from './types'

import SpotifyFacade from './spotify-facade'

const SpotifyCard: React.FC<ISpotifyCard> = ({ podcast, priority = false }) => {
  const { attributes } = podcast

  // Normalize data - handle both camelCase and snake_case from API
  const spotifyId =
    attributes?.spotifyId || attributes?.spotify_id || podcast.id
  const title = attributes?.title || ''

  // Spotify embed iframe URL
  const embedUrl = `https://open.spotify.com/embed/episode/${spotifyId}`

  return (
    <div
      className={twMerge(
        'spotify-card w-full relative', // Removed border, bg and shadow
        animate()
      )}
    >
      {/* "Novo" Badge - only show on first card (priority) */}
      {priority && (
        <div className="absolute top-3 right-3 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          NOVO
        </div>
      )}

      {/* Spotify Embed Player */}
      <div className="w-full">
        <SpotifyFacade
          embedUrl={embedUrl}
          title={title}
          height={300}
          className="rounded-lg w-full"
        />
      </div>
    </div>
  )
}

export default SpotifyCard
