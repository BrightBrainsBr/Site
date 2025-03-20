import {
  Autoformat,
  Bold,
  Italic,
  Underline,
  Essentials,
  Heading,
  HeadingButtonsUI,
  Indent,
  HeadingUI,
  FontColor,
  SourceEditing,
} from 'ckeditor5'
import type { Preset } from '@_sh/strapi-plugin-ckeditor'

import { STYLES, fontColor } from '../configs'
import TitlePlugin from './plugin'

const getTitleEditor = (
  key: string,
  name: string,
  headingLevel: number = 2
): Preset => {
  return {
    name: key,
    description: name,
    styles: STYLES,
    editorConfig: {
      licenseKey: 'GPL',
      fontColor,
      plugins: [
        Autoformat,
        Bold,
        Italic,
        Underline,
        Essentials,
        Heading,
        HeadingButtonsUI,
        HeadingUI,
        Indent,
        SourceEditing,
        FontColor,
        TitlePlugin,
      ],
      toolbar: [
        ...(headingLevel <= 1 ? ['heading1'] : []),
        ...(headingLevel <= 2 ? ['heading2'] : []),
        ...(headingLevel <= 3 ? ['heading3'] : []),
        'heading4',
        '|',
        'bold',
        'italic',
        'underline',
        '|',
        'fontColor',
      ],
      heading: {
        // initial: isMainHeading ? 'heading1' : 'heading2',
        options: [
          ...(headingLevel <= 1
            ? [
                {
                  model: 'heading1' as any,
                  view: 'h1',
                  title: 'Heading 1',
                  class: 'ck-heading_heading1',
                },
              ]
            : []),
          ...(headingLevel <= 2
            ? [
                {
                  model: 'heading2',
                  view: 'h2',
                  title: 'Heading 2',
                  class: 'ck-heading_heading2',
                },
              ]
            : []),
          ...(headingLevel <= 3
            ? [
                {
                  model: 'heading3',
                  view: 'h3',
                  title: 'Heading 3',
                  class: 'ck-heading_heading3',
                },
              ]
            : []),
          {
            model: 'heading4',
            view: 'h4',
            title: 'Heading 4',
            class: 'ck-heading_heading4',
          },
        ],
      },
    },
  }
}

export const titleEditor = getTitleEditor('titleEditor', 'Title Editor')
export const mainTitleEditor = getTitleEditor(
  'mainTitleEditor',
  'Main Title Editor',
  1
)
export const subTitleEditor = getTitleEditor(
  'subTitleEditor',
  'Sub Title Editor',
  3
)
