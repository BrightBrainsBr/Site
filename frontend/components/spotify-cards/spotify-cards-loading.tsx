import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

interface ISpotifyCardsLoadingProps {
  title?: string
  className?: string
}

const SpotifyCardsLoading: React.FC<ISpotifyCardsLoadingProps> = ({
  title = 'Últimos Episódios do Podcast',
  className,
}) => {
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
          'auto-rows-fr',
          animate()
        )}
      >
        {/* Loading skeleton cards */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`loading-card-${index}`}
            className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200"
          >
            {/* Image skeleton */}
            <div className="w-full aspect-square bg-gray-300 animate-pulse relative">
              <div className="absolute top-3 right-3 w-8 h-8 bg-gray-400 rounded-full"></div>
              <div className="absolute bottom-3 left-3 w-16 h-6 bg-gray-400 rounded"></div>
            </div>

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              {/* Title skeleton */}
              <div className="space-y-2">
                <div className="h-5 bg-gray-300 animate-pulse rounded w-full"></div>
                <div className="h-5 bg-gray-300 animate-pulse rounded w-3/4"></div>
              </div>

              {/* Description skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3"></div>
              </div>

              {/* Meta skeleton */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="h-3 bg-gray-200 animate-pulse rounded w-20"></div>
                <div className="h-3 bg-gray-200 animate-pulse rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading text */}
      <div className={twMerge('text-center mt-8', animate())}>
        <div className="inline-flex items-center gap-2 text-gray-400">
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Carregando episódios...
        </div>
      </div>
    </div>
  )
}

export default SpotifyCardsLoading
