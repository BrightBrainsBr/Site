import type { LinkProps } from 'next/link'

type StyleVariant<T> = T | { md: T; initial: T }
type ButtonStyles = 'default' | 'icon'

export interface IButtonStyles {
  style?: StyleVariant<ButtonStyles>
  tiny?: StyleVariant<boolean>
}

export interface ButtonBaseProperties {
  blank?: boolean
  text?: string
}

type ButtonAnchorProperties = {
  component: 'link'
} & React.AnchorHTMLAttributes<HTMLAnchorElement> &
  LinkProps

type ButtonHTMLButtonProperties = {
  component: 'button'
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export type ButtonProperties = ButtonBaseProperties &
  (ButtonAnchorProperties | ButtonHTMLButtonProperties)

export type ClientButtonProperties = ButtonBaseProperties &
  React.ButtonHTMLAttributes<HTMLButtonElement>
