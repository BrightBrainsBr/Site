'use client'

import React, { Suspense } from 'react'

import SpotifyCardsContainer from './spotify-cards-container'
import SpotifyCardsError from './spotify-cards-error'
import SpotifyCardsLoading from './spotify-cards-loading'
import type { IPodcastData } from './types'

interface ISpotifyCardsWrapperProps {
  podcasts?: IPodcastData[]
  title?: string
  className?: string
  isLoading?: boolean
  error?: string
  onRetry?: () => void
}

const SpotifyCardsWrapper: React.FC<ISpotifyCardsWrapperProps> = ({
  podcasts,
  title,
  className,
  isLoading = false,
  error,
  onRetry,
}) => {
  // Error state
  if (error) {
    return (
      <SpotifyCardsError
        title={title}
        className={className}
        error={error}
        onRetry={onRetry}
      />
    )
  }

  // Loading state
  if (isLoading || !podcasts) {
    return <SpotifyCardsLoading title={title} className={className} />
  }

  // Success state
  return (
    <Suspense
      fallback={<SpotifyCardsLoading title={title} className={className} />}
    >
      <SpotifyCardsContainer
        podcasts={podcasts}
        title={title}
        className={className}
      />
    </Suspense>
  )
}

export default SpotifyCardsWrapper
