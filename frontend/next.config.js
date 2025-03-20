const withSvgr = require('next-plugin-svgr')
const withPlugins = require('next-compose-plugins')
const createNextIntlPlugin = require('next-intl/plugin')
const csp = require('./configs/csp')
const redirects = require('./configs/redirects')
const domains = require('./configs/domains')

const { withHelpers } = require('@futurebrand/helpers-nextjs/plugins')

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {},
  reactStrictMode: false,
}

/**
 * @type {import('@futurebrand/plugins/types').IHelpersConfig}
 */
const helpersConfig = {
  cms: {
    type: 'strapi',
    url: process.env.CMS_BASE_URL,
    token: process.env.CMS_FRONTEND_TOKEN,
  },
  cdn: process.env.CDN_IMAGES_URL,
  siteUrl: process.env.SITE_URL,
  domains,
  csp,
  redirects,
  revalidate: process.env.NODE_ENV === 'production' ? 60 : 0,
}

//
const withNextIntl = createNextIntlPlugin('./i18n.ts')

// Plugins
const configsPluggins = [
  [
    withSvgr,
    {
      fileLoader: true,
      svgrOptions: {
        titleProp: true,
        icon: true,
      },
    },
  ],
  [withNextIntl, {}],
  [
    withHelpers,
    {
      futureBrandHelpers: helpersConfig,
    },
  ],
]

if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
  configsPluggins.push([withBundleAnalyzer])
}

module.exports = withPlugins(configsPluggins, nextConfig)
