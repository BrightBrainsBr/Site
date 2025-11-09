/**
 * Manual sync controller
 */

export default {
  async sync(ctx) {
    try {
      const { PodcastSyncService } = require('../../../app/spotify/podcast-sync')
      const syncService = new PodcastSyncService(strapi)
      
      console.log('[Manual Sync] Starting synchronization via HTTP endpoint...')
      const result = await syncService.syncPodcasts()
      
      ctx.body = {
        success: result.success,
        message: result.message,
        processed: result.processed,
      }
    } catch (error) {
      console.error('[Manual Sync] Error:', error)
      ctx.body = {
        success: false,
        message: error.message,
        error: error.stack,
      }
      ctx.status = 500
    }
  },
}
