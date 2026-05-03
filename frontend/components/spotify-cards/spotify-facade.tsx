'use client'

import React, { useState } from 'react'

interface Props {
  embedUrl: string
  title: string
  height?: string | number
  className?: string
}

const SpotifyFacade: React.FC<Props> = ({ embedUrl, title, height = 300, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  if (isLoaded) {
    return (
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        title={title}
        className={className}
        style={{ colorScheme: 'normal' }}
      />
    )
  }

  return (
    <button
      onClick={() => setIsLoaded(true)}
      className={`w-full flex items-center justify-center bg-[#282828] text-white hover:bg-[#333333] transition-colors cursor-pointer group ${className}`}
      style={{ height }}
      aria-label={`Ouvir ${title}`}
    >
      <div className="flex flex-col items-center gap-3">
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="currentColor"
          className="text-[#1DB954] group-hover:scale-110 transition-transform duration-300"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <span className="text-sm font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
          Clique para ouvir
        </span>
      </div>
    </button>
  )
}

export default SpotifyFacade
