import type {
  IStrapiButton,
  IStrapiLinkButton,
} from '@futurebrand/types/strapi'
import React from 'react'

import { ReactComponent as DownloadIcon } from '~/assets/icons/download.svg'
import { ReactComponent as BlankIcon } from '~/assets/icons/link-blank.svg'

import type { ButtonProperties, IButtonStyles } from '../types'
import VariantButton from '../variant'

interface BaseProperties extends IButtonStyles {
  attributes: IStrapiLinkButton | IStrapiButton
}

type Properties = BaseProperties & Partial<ButtonProperties>

const CMSButton: React.FC<Properties> = ({
  attributes,
  tiny,
  style,
  children,
  ...rest
}) => {
  if ('url' in attributes) {
    return (
      <VariantButton
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        component="link"
        blank={attributes.blank}
        variant={attributes.variant}
        text={attributes.text}
        href={attributes.url}
        tiny={tiny}
        style={style}
        download={attributes.download}
      >
        {attributes.download ? (
          <DownloadIcon />
        ) : (
          attributes.blank && <BlankIcon />
        )}
        {children}
      </VariantButton>
    )
  }

  return (
    <VariantButton
      type="button"
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      component="button"
      variant={attributes.variant}
      text={attributes.text}
      tiny={tiny}
      style={style}
    >
      {children}
    </VariantButton>
  )
}

export default CMSButton
