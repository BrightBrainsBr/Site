import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type { ISpotifyCard } from './types'

const SpotifyCard: React.FC<ISpotifyCard> = ({ podcast, priority = false }) => {
  const { attributes } = podcast
  
  // Normalize data - handle both camelCase and snake_case from API
  const spotifyId = attributes.spotifyId || attributes.spotify_id || ''
  const spotifyUrl = attributes.spotifyUrl || attributes.spotify_url || ''
  const { title } = attributes

  // Spotify embed iframe URL
  const embedUrl = `https://open.spotify.com/embed/episode/${spotifyId}`

  return (
    <div
      className={twMerge(
        'spotify-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300',
        'border border-gray-200 hover:border-green-400',
        'w-full relative', // Added relative for badge positioning
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
        <iframe
          src={embedUrl}
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={title}
          className="rounded-lg w-full"
        />
      </div>
    </div>
  )
}

export default SpotifyCard
