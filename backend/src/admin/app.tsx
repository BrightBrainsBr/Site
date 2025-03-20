import { updateEditorConfigs } from './editor'

export default {
  config: {
    // Permite colocar o strapi em Pt-BR nas configurações de usuário
    locales: ['pt-BR'],
  },
  bootstrap() {},
  async register() {
    await updateEditorConfigs()
  },
}
