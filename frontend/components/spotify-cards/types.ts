// Raw podcast data as it comes from API (flat structure)
export interface IPodcastRawData {
  id: number
  documentId?: string
  spotifyId: string
  title: string
  description: string
  imageUrl?: string
  spotifyUrl: string
  duration: number
  publishedDate?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  locale?: string
}

export interface IPodcastData {
  id: number
  attributes: {
    // Support both camelCase and snake_case from API
    spotifyId?: string
    spotify_id?: string
    title: string
    description: string
    imageUrl?: string
    image_url?: string
    spotifyUrl?: string
    spotify_url?: string
    duration: number
    publishedDate?: string
    published_date?: string
    createdAt?: string
    created_at?: string
    updatedAt?: string
    updated_at?: string
    publishedAt?: string
    published_at?: string
  }
}

// Helper to normalize podcast data from API (handles both camelCase and snake_case)
export const normalizePodcastData = (podcast: IPodcastData): IPodcastData => {
  const attrs = podcast.attributes
  return {
    ...podcast,
    attributes: {
      spotifyId: attrs.spotifyId || attrs.spotify_id || '',
      title: attrs.title,
      description: attrs.description,
      imageUrl: attrs.imageUrl || attrs.image_url,
      spotifyUrl: attrs.spotifyUrl || attrs.spotify_url || '',
      duration: attrs.duration,
      publishedDate: attrs.publishedDate || attrs.published_date || '',
      createdAt: attrs.createdAt || attrs.created_at || '',
      updatedAt: attrs.updatedAt || attrs.updated_at || '',
      publishedAt: attrs.publishedAt || attrs.published_at || '',
    },
  }
}

export interface ISpotifyCard {
  podcast: IPodcastData
  priority?: boolean
}

export interface ISpotifyCardsProps {
  podcasts: IPodcastData[]
  title?: string
  limit?: number
}

export interface ISpotifyCardsContainerProps {
  podcasts: (IPodcastData | IPodcastRawData)[]
  title?: string
  className?: string
}
