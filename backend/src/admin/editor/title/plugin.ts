import { Plugin } from 'ckeditor5'

class TitlePlugin extends Plugin {
  init() {
    this.editor.commands.add('doNothing', {
      execute: () => {},
      destroy: () => {},
    } as any)

    this.editor.on('ready', () => {
      const data = this.editor.data.get()
      const headingConfig = this.editor.config.get('heading')
      const initialHeading = headingConfig?.options?.[0]?.model

      if (!data) {
        this.editor.commands.execute('heading', {
          value: initialHeading,
        } as any)
      }
    })

    this.editor.keystrokes.set('enter', 'doNothing')
  }

  destroy() {}
}

export default TitlePlugin
