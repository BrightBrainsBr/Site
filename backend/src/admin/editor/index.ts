import baseEditor from './base'
import titleEditors from './title'

import { setPluginConfig, type PluginConfig } from '@_sh/strapi-plugin-ckeditor'

const config: PluginConfig = {
  /**
   * Note: Since the provided `presets` include only `myCustomPreset`
   * this configuration will overwrite default presets.
   */
  presets: [baseEditor, ...titleEditors],
}

export async function updateEditorConfigs() {
  setPluginConfig(config)
}
