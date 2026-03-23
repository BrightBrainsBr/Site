const imagesDomain = require('./domains')

function getHost(url) {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

const cmsHostName = getHost(process.env.CMS_BASE_URL)
const siteHostName = getHost(process.env.SITE_URL)
const supabaseHostName = getHost(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
)

const REQUIRED_DEFAULT_HOSTS = [siteHostName, cmsHostName].filter(Boolean)
const OPTIONAL_CONNECT_HOSTS = [supabaseHostName].filter(Boolean)

const DEFAULT_SRC = [
  ...REQUIRED_DEFAULT_HOSTS,
  ...OPTIONAL_CONNECT_HOSTS,
  '*.google-analytics.com',
  '*.googletagmanager.com',
  '*.google.com',
  '*.doubleclick.net',
  '*.futurebrand.dev',
  '*.cookieyes.com',
  '*.cdn-cookieyes.com',
]
const SCRIPTS_SRC = [
  "'unsafe-eval'",
  "'unsafe-inline'",
  '*.googletagmanager.com',
  '*.google-analytics.com',
  'cdn-cookieyes.com',
  '*.cookieyes.com',
  '*.youtube.com',
]
const STYLES_SRC = ['fonts.googleapis.com']
const FRAMES_SRC = ['www.youtube.com', 'open.spotify.com', '*.doubleclick.net']
const IMAGES_SRC = [
  ...[cmsHostName, supabaseHostName].filter(Boolean),
  ...imagesDomain,
  'blob:',
  'data:',
  'painel-website.brightbrains.com.br',
  'eeafzrdabyjzefbvayjf.supabase.co',
  'strapi-projects-futurebrand.s3.amazonaws.com',
  'strapi-projects-futurebrand.s3.us-east-1.amazonaws.com',
  'd1a30r7wqil0mo.cloudfront.net',
  'i.scdn.co',
  '*.ytimg.com',
  '*.googletagmanager.com',
  '*.google-analytics.com',
  '*.doubleclick.net',
]
const CONNECT_SRC = [
  ...REQUIRED_DEFAULT_HOSTS,
  ...OPTIONAL_CONNECT_HOSTS,
  'painel-website.brightbrains.com.br',
  'eeafzrdabyjzefbvayjf.supabase.co',
  '*.google-analytics.com',
  '*.googletagmanager.com',
  '*.google.com',
]

/**
 * @type {import('@futurebrand/plugins/types').ICSPConfigs}
 */
module.exports = {
  defaultSrc: DEFAULT_SRC,
  connectSrc: CONNECT_SRC,
  scriptSrc: SCRIPTS_SRC,
  styleSrc: STYLES_SRC,
  frameSrc: FRAMES_SRC,
  imgSrc: IMAGES_SRC,
}
