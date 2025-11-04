import { animate } from '@futurebrand/helpers-nextjs/utils'
import React from 'react'
import { twMerge } from 'tailwind-merge'

interface ISpotifyCardsErrorProps {
  title?: string
  className?: string
  error?: string
  onRetry?: () => void
}

const SpotifyCardsError: React.FC<ISpotifyCardsErrorProps> = ({
  title = 'Últimos Episódios do Podcast',
  className,
  error,
  onRetry,
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

      <div className={twMerge('text-center py-12', animate())}>
        {/* Error icon */}
        <div className="w-16 h-16 mx-auto mb-4 text-red-400">
          <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-full h-full"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Erro ao carregar episódios
        </h3>

        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {error || 'Não foi possível carregar os episódios do podcast no momento. Tente novamente mais tarde.'}
        </p>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Tentar novamente
          </button>
        )}

        {/* Alternative actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            Ou visite diretamente:
          </p>
          <a
            href="https://open.spotify.com/show/27Ea3Q6N75RmWg0vyzQtCr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Nosso podcast no Spotify
          </a>
        </div>
      </div>
    </div>
  )
}

export default SpotifyCardsError