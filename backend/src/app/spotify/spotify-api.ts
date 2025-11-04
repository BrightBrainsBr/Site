import axios, { AxiosInstance, AxiosError } from 'axios'
import {
  ISpotifyConfig,
  ISpotifyServiceResponse,
  ISpotifyAuthResponse,
  ISpotifyEpisode,
  ISpotifyShowEpisodesResponse,
  SpotifyAuthResponseSchema,
  SpotifyShowEpisodesResponseSchema,
  IRateLimitState,
} from './types'

/**
 * Spotify Web API Client
 * Implements Client Credentials Flow for server-to-server authentication
 * Includes basic rate limiting and error handling
 */
export class SpotifyApiClient {
  private config: ISpotifyConfig
  private axiosInstance: AxiosInstance
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0
  private rateLimitState: IRateLimitState = {
    requests: 0,
    resetTime: Date.now() + 60000, // Reset every minute
  }

  constructor(config: ISpotifyConfig) {
    this.config = config
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds timeout
    })

    // Add request interceptor for rate limiting
    this.axiosInstance.interceptors.request.use(async (config) => {
      await this.checkRateLimit()
      return config
    })
  }

  /**
   * Basic rate limiting: maximum 100 requests per minute
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    
    if (now > this.rateLimitState.resetTime) {
      this.rateLimitState.requests = 0
      this.rateLimitState.resetTime = now + 60000
    }

    if (this.rateLimitState.requests >= 100) {
      const waitTime = this.rateLimitState.resetTime - now
      console.warn(`[Spotify API] Rate limit reached, waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.rateLimitState.requests++
  }

  /**
   * Authenticate using Client Credentials Flow
   */
  private async authenticate(): Promise<ISpotifyServiceResponse<ISpotifyAuthResponse>> {
    try {
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64')

      const response = await this.axiosInstance.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      const validatedData = SpotifyAuthResponseSchema.parse(response.data)
      
      this.accessToken = validatedData.access_token
      this.tokenExpiresAt = Date.now() + (validatedData.expires_in * 1000) - 60000 // Refresh 1 minute early

      console.log('[Spotify API] Authentication successful')
      
      return {
        success: true,
        data: validatedData,
        statusCode: response.status,
      }
    } catch (error) {
      return this.handleError('Authentication failed', error)
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      const authResult = await this.authenticate()
      return authResult.success
    }
    return true
  }

  /**
   * Get episodes from a specific show
   */
  public async getShowEpisodes(
    limit: number = 50,
    offset: number = 0,
    market: string = 'US'
  ): Promise<ISpotifyServiceResponse<ISpotifyEpisode[]>> {
    try {
      const isAuthenticated = await this.ensureValidToken()
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Failed to authenticate with Spotify API',
        }
      }

      const response = await this.axiosInstance.get(
        `https://api.spotify.com/v1/shows/${this.config.showId}/episodes`,
        {
          params: { limit, offset, market },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      const validatedData = SpotifyShowEpisodesResponseSchema.parse(response.data)
      
      console.log(`[Spotify API] Retrieved ${validatedData.items.length} episodes`)

      return {
        success: true,
        data: validatedData.items,
        statusCode: response.status,
      }
    } catch (error) {
      return this.handleError('Failed to fetch show episodes', error)
    }
  }

  /**
   * Get the latest episodes from the show
   */
  public async getLatestEpisodes(count: number = 3): Promise<ISpotifyServiceResponse<ISpotifyEpisode[]>> {
    const result = await this.getShowEpisodes(count, 0)
    
    if (result.success && result.data) {
      // Sort by release date to ensure we get the latest
      const sortedEpisodes = result.data.sort((a, b) => 
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      )
      
      return {
        ...result,
        data: sortedEpisodes.slice(0, count),
      }
    }

    return result
  }

  /**
   * Health check method to test API connectivity
   */
  public async healthCheck(): Promise<ISpotifyServiceResponse<boolean>> {
    try {
      const result = await this.getShowEpisodes(1, 0)
      return {
        success: result.success,
        data: result.success,
        error: result.error,
        statusCode: result.statusCode,
      }
    } catch (error) {
      return this.handleError('Health check failed', error)
    }
  }

  /**
   * Centralized error handling
   */
  private handleError(message: string, error: unknown): ISpotifyServiceResponse<never> {
    let errorMessage = message
    let statusCode: number | undefined

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      errorMessage += `: ${axiosError.message}`
      statusCode = axiosError.response?.status

      if (axiosError.response?.data) {
        console.error('[Spotify API] Error response:', axiosError.response.data)
      }
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`
    }

    console.error(`[Spotify API] ${errorMessage}`)
    
    return {
      success: false,
      error: errorMessage,
      statusCode,
    }
  }
}

/**
 * Factory function to create a Spotify API client
 */
export function createSpotifyClient(config: ISpotifyConfig): SpotifyApiClient {
  return new SpotifyApiClient(config)
}