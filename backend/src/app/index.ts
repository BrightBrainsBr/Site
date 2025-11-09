/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AppClient,
  ContentClient,
  GlobalClient,
} from '@futurebrand/helpers-strapi/modules'
import {
  FormClient,
  FormMiddlewareClient,
} from '@futurebrand/helpers-strapi/services'
import {
  HubspotIntegration,
  EmailIntegration,
  RDStationIntegration,
} from '@futurebrand/helpers-strapi/integrations'
import type { Core } from '@strapi/strapi'
import * as cron from 'node-cron'

import { getEmailView } from './email'
import { createSearchRelation } from './search'
import { PodcastSyncService } from './spotify'

import AppContentClient from './contents'
import { IForm, IFormContext } from '@futurebrand/helpers-strapi/types'

import DefaultBlocksHandler from './blocks/blocks'
import WrappersBlocksHandler from './blocks/wrappers'

class MyFormMidleware extends FormMiddlewareClient {
  async execute(form: IForm, data: any, context: IFormContext) {
    // Do something before the form is submitted
    return null
  }
}

class App extends AppClient {
  getContentClient(): ContentClient {
    return new AppContentClient()
  }

  getGlobalClient(): GlobalClient {
    return new GlobalClient({
      seo: 'api::global-seo.global-seo',
      blocks: {
        uid: 'api::global-block.global-block',
        blockHandlers: [DefaultBlocksHandler, WrappersBlocksHandler],
      },
      data: {
        options: 'api::global-option.global-option',
        structure: 'api::global-structure.global-structure',
      },
    })
  }

  getFormClient(): FormClient | null {
    const formClient = new FormClient('api::form.form', {
      fields: {
        input: 'forms.input-field',
        textarea: 'forms.textarea-field',
        select: 'forms.select-field',
        check: 'forms.check-field',
        hidden: 'forms.hidden-field',
        file: 'forms.file-field',
        custom: [
          {
            uid: 'forms.title-field',
          },
        ],
      },
    })

    formClient.addIntegration(
      'forms-integrations.hubspot',
      new HubspotIntegration()
    )
    formClient.addIntegration(
      'forms-integrations.email',
      new EmailIntegration(getEmailView)
    )
    formClient.addIntegration(
      'forms-integrations.rd-station',
      new RDStationIntegration()
    )

    formClient.addMiddleware(new MyFormMidleware())

    return formClient
  }

  async instantiate(strapi: Core.Strapi) {
    await super.instantiate(strapi)
    
    // Initialize search relation
    await createSearchRelation()
    
    // Initialize Spotify podcast synchronization (without health check on startup)
    this.initializePodcastSync(strapi)
  }

  /**
   * Initialize Spotify podcast synchronization cronjob
   */
  private initializePodcastSync(strapi: Core.Strapi) {
    try {
      // Create podcast sync service
      const podcastSync = new PodcastSyncService(strapi)

      // Run initial sync on startup
      console.log(`[App] 🔄 Running initial podcast synchronization...`)
      podcastSync.syncPodcasts()
        .then((result) => {
          if (result.success) {
            console.log(`[App] ✅ Initial sync completed: ${result.message}`)
          } else {
            console.error(`[App] ❌ Initial sync failed: ${result.message}`)
          }
        })
        .catch((error) => {
          console.error(`[App] ❌ Initial sync error:`, error)
        })

      // Schedule cronjob to run daily at 3:00 AM
      // Cron format: second minute hour day month day-of-week
      // 0 0 3 * * * = Every day at 3:00 AM
      const cronJob = cron.schedule('0 0 3 * * *', async () => {
        console.log(`[Cronjob] Starting scheduled podcast synchronization`)
        const result = await podcastSync.syncPodcasts()
        
        if (result.success) {
          console.log(`[Cronjob] ✅ ${result.message}`)
        } else {
          console.error(`[Cronjob] ❌ ${result.message}`)
        }
      }, {
        timezone: 'America/Sao_Paulo', // Brazilian timezone
      })

      console.log(`[App] ✅ Podcast synchronization cronjob scheduled for daily execution at 3:00 AM (Brazil/SP timezone)`)

    } catch (error) {
      console.error(`[App] Failed to initialize podcast synchronization:`, error)
      console.error(`[App] Spotify integration will not be available`)
    }
  }
}

export default App
