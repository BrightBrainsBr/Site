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

import { getEmailView } from './email'
import { createSearchRelation } from './search'

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
    // Do something after the app is instantiated
    await createSearchRelation()
  }
}

export default App
