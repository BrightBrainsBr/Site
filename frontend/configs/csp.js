/* eslint-disable @typescript-eslint/no-require-imports */
const imagesDomain = require('./domains')

const cmsBaseUrl = process.env.CMS_BASE_URL
const cmsHostName = new URL(cmsBaseUrl).host

const siteUrl = process.env.SITE_URL
const siteHostName = new URL(siteUrl).host

const DEFAULT_SRC = [
  siteHostName,
  cmsHostName,
  '*.google-analytics.com',
  '*.futurebrand.dev',
  '*.cookieyes.com',
  '*.cdn-cookieyes.com',
]
const SCRIPTS_SRC = [
  '*.googletagmanager.com',
  'cdn-cookieyes.com',
  '*.cookieyes.com',
  '*.youtube.com',
]
const STYLES_SRC = []
const FRAMES_SRC = ['www.youtube.com']
const IMAGES_SRC = [cmsHostName, ...imagesDomain, '*.ytimg.com']

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
