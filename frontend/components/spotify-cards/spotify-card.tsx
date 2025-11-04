import { animate } from '@futurebrand/helpers-nextjs/utils'
import Image from 'next/image'
import React from 'react'
import { twMerge } from 'tailwind-merge'

import type { ISpotifyCard } from './types'

const SpotifyCard: React.FC<ISpotifyCard> = ({ podcast, priority = false }) => {
  const { attributes } = podcast
  const { title, description, imageUrl, spotifyUrl, duration, publishedDate } =
    attributes

  // Convert duration from milliseconds to minutes
  const durationInMinutes = Math.round(duration / 60000)

  // Format published date
  const formattedDate = new Date(publishedDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // Truncate description if too long
  const truncatedDescription =
    description.length > 120
      ? `${description.substring(0, 120)}...`
      : description

  return (
    <div
      className={twMerge(
        'spotify-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300',
        'border border-gray-200 hover:border-green-400',
        'group cursor-pointer',
        animate()
      )}
    >
      <a
        href={spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {/* Image Section */}
        {imageUrl && (
          <div className="relative w-full aspect-square overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Spotify Icon Overlay */}
            <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-3 left-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {durationInMinutes} min
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg text-midnight-950 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 leading-relaxed line-clamp-3">
            {truncatedDescription}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>{formattedDate}</span>
            <span className="text-green-600 font-medium group-hover:text-green-700">
              Ouvir no Spotify
            </span>
          </div>
        </div>
      </a>
    </div>
  )
}

export default SpotifyCard
