import { z } from 'zod'

// Spotify API Response Types
export const SpotifyAuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
})

export const SpotifyEpisodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  external_urls: z.object({
    spotify: z.string(),
  }),
  images: z.array(z.object({
    url: z.string(),
    height: z.number().nullable(),
    width: z.number().nullable(),
  })),
  release_date: z.string(),
  duration_ms: z.number(),
  type: z.literal('episode'),
})

export const SpotifyShowEpisodesResponseSchema = z.object({
  items: z.array(SpotifyEpisodeSchema),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export const SpotifyShowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  external_urls: z.object({
    spotify: z.string(),
  }),
  images: z.array(z.object({
    url: z.string(),
    height: z.number().nullable(),
    width: z.number().nullable(),
  })),
  episodes: SpotifyShowEpisodesResponseSchema,
})

// TypeScript interfaces
export type ISpotifyAuthResponse = z.infer<typeof SpotifyAuthResponseSchema>
export type ISpotifyEpisode = z.infer<typeof SpotifyEpisodeSchema>
export type ISpotifyShowEpisodesResponse = z.infer<typeof SpotifyShowEpisodesResponseSchema>
export type ISpotifyShow = z.infer<typeof SpotifyShowSchema>

// Configuration interface
export interface ISpotifyConfig {
  clientId: string
  clientSecret: string
  showId: string
}

// Service response types
export interface ISpotifyServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

// Rate limiting types
export interface IRateLimitState {
  requests: number
  resetTime: number
}