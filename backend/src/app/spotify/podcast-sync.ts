import type { Core } from '@strapi/strapi'
import { createSpotifyClient } from './spotify-api'
import { ISpotifyConfig, ISpotifyEpisode } from './types'

/**
 * Podcast synchronization service
 * Handles fetching episodes from Spotify and saving them to Strapi
 */
export class PodcastSyncService {
  private strapi: Core.Strapi
  private spotifyClient: ReturnType<typeof createSpotifyClient>

  constructor(strapi: Core.Strapi) {
    this.strapi = strapi
    
    // Initialize Spotify client with environment variables
    const config: ISpotifyConfig = {
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
      showId: '27Ea3Q6N75RmWg0vyzQtCr', // Target show ID
    }

    if (!config.clientId || !config.clientSecret) {
      throw new Error('Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.')
    }

    this.spotifyClient = createSpotifyClient(config)
  }

  /**
   * Main synchronization method
   * Fetches latest episodes and saves new ones to the database
   */
  async syncPodcasts(): Promise<{ success: boolean; message: string; processed: number }> {
    const startTime = Date.now()
    console.log(`[Podcast Sync] Starting synchronization at ${new Date().toISOString()}`)

    try {
      // Step 1: Fetch latest episodes from Spotify
      const episodesResult = await this.spotifyClient.getLatestEpisodes(10) // Get more to ensure we don't miss any
      
      if (!episodesResult.success || !episodesResult.data) {
        const errorMsg = `Failed to fetch episodes from Spotify: ${episodesResult.error}`
        console.error(`[Podcast Sync] ${errorMsg}`)
        return { success: false, message: errorMsg, processed: 0 }
      }

      console.log(`[Podcast Sync] Retrieved ${episodesResult.data.length} episodes from Spotify`)

      // Step 2: Check which episodes already exist in database
      const existingPodcasts = await this.strapi.entityService.findMany('api::podcast.podcast', {
        fields: ['spotifyId'],
        pagination: { limit: 100 }, // Should be enough for checking duplicates
      })

      const existingSpotifyIds = new Set(
        Array.isArray(existingPodcasts) 
          ? existingPodcasts.map((podcast: any) => podcast.spotifyId)
          : []
      )

      console.log(`[Podcast Sync] Found ${existingSpotifyIds.size} existing podcasts in database`)

      // Step 3: Filter new episodes
      const newEpisodes = episodesResult.data.filter(episode => 
        !existingSpotifyIds.has(episode.id)
      )

      console.log(`[Podcast Sync] Found ${newEpisodes.length} new episodes to save`)

      // Step 4: Save new episodes to database
      let savedCount = 0
      for (const episode of newEpisodes) {
        try {
          await this.saveEpisodeToDatabase(episode)
          savedCount++
          console.log(`[Podcast Sync] Saved episode: ${episode.name}`)
        } catch (error) {
          console.error(`[Podcast Sync] Failed to save episode ${episode.id}:`, error)
        }
      }

      const duration = Date.now() - startTime
      const successMsg = `Synchronization completed successfully. Processed ${savedCount} new episodes in ${duration}ms`
      console.log(`[Podcast Sync] ${successMsg}`)

      return { success: true, message: successMsg, processed: savedCount }

    } catch (error) {
      const errorMsg = `Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(`[Podcast Sync] ${errorMsg}`, error)
      return { success: false, message: errorMsg, processed: 0 }
    }
  }

  /**
   * Save a single episode to the database
   */
  private async saveEpisodeToDatabase(episode: ISpotifyEpisode): Promise<void> {
    // Get the best quality image
    const imageUrl = episode.images.length > 0 
      ? episode.images[0].url 
      : undefined

    // Create the podcast entry
    await this.strapi.entityService.create('api::podcast.podcast', {
      data: {
        spotifyId: episode.id,
        title: episode.name,
        description: episode.description,
        imageUrl: imageUrl,
        spotifyUrl: episode.external_urls.spotify,
        duration: episode.duration_ms,
        publishedDate: new Date(episode.release_date),
        publishedAt: new Date(), // Make it published immediately
      },
    })
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const spotifyHealthy = await this.spotifyClient.healthCheck()
      
      if (!spotifyHealthy.success) {
        return { 
          success: false, 
          message: `Spotify API not accessible: ${spotifyHealthy.error}` 
        }
      }

      // Test database connection
      const count = await this.strapi.entityService.count('api::podcast.podcast')
      
      return { 
        success: true, 
        message: `Service healthy. Database has ${count} podcasts.` 
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }
}