import React from 'react'

import { ReactComponent as FacebookIcon } from '~/assets/icons/facebook.svg'
import { ReactComponent as InstagramIcon } from '~/assets/icons/instagram.svg'
import { ReactComponent as LinkedinIcon } from '~/assets/icons/linkedin.svg'
import { ReactComponent as EmailIcon } from '~/assets/icons/mail.svg'
import { ReactComponent as PhoneIcon } from '~/assets/icons/phone.svg'
import { ReactComponent as SiteIcon } from '~/assets/icons/site.svg'
import { ReactComponent as TiktokIcon } from '~/assets/icons/tiktok.svg'
import { ReactComponent as TwitterIcon } from '~/assets/icons/twitter.svg'
import { ReactComponent as WhatsAppIcon } from '~/assets/icons/whatsapp.svg'
import { ReactComponent as YoutubeIcon } from '~/assets/icons/youtube.svg'

type SVGProps = React.SVGProps<SVGSVGElement>

const SOCIAL_ICONS: Partial<Record<string, React.FC<SVGProps>>> = {
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  youtube: YoutubeIcon,
  whatsapp: WhatsAppIcon,
  linkedin: LinkedinIcon,
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
  phone: PhoneIcon,
  email: EmailIcon,
  site: SiteIcon,
}

type Properties = {
  name: string
} & React.SVGProps<SVGSVGElement>

function SocialIcon({ name, ...rest }: Properties) {
  const Icon = SOCIAL_ICONS[name]

  if (!Icon) {
    return
  }

  return <Icon {...rest} />
}

export default SocialIcon
