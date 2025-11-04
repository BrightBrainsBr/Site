export interface IPodcastData {
  id: number
  attributes: {
    spotifyId: string
    title: string
    description: string
    imageUrl?: string
    spotifyUrl: string
    duration: number
    publishedDate: string
    createdAt: string
    updatedAt: string
    publishedAt: string
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
  podcasts: IPodcastData[]
  title?: string
  className?: string
}
