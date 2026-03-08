const imagesDomain = require('./domains')

const cmsBaseUrl = process.env.CMS_BASE_URL
const cmsHostName = new URL(cmsBaseUrl).host

const siteUrl = process.env.SITE_URL
const siteHostName = new URL(siteUrl).host

const DEFAULT_SRC = [
  siteHostName,
  cmsHostName,
  '*.google-analytics.com',
  '*.googletagmanager.com',
  '*.google.com',
  '*.doubleclick.net',
  '*.futurebrand.dev',
  '*.cookieyes.com',
  '*.cdn-cookieyes.com',
]
const SCRIPTS_SRC = [
  '*.googletagmanager.com',
  '*.google-analytics.com',
  'cdn-cookieyes.com',
  '*.cookieyes.com',
  '*.youtube.com',
]
const STYLES_SRC = ['fonts.googleapis.com']
const FRAMES_SRC = ['www.youtube.com', 'open.spotify.com', '*.doubleclick.net']
const IMAGES_SRC = [
  cmsHostName,
  ...imagesDomain,
  '*.ytimg.com',
  '*.googletagmanager.com',
  '*.google-analytics.com',
  '*.doubleclick.net',
]

/**
 * @type {import('@futurebrand/plugins/types').ICSPConfigs}
 */
module.exports = {
  defaultSrc: DEFAULT_SRC,
  scriptSrc: SCRIPTS_SRC,
  styleSrc: STYLES_SRC,
  frameSrc: FRAMES_SRC,
  imgSrc: IMAGES_SRC,
}
