import crypto from 'node:crypto'

const isDev = process.env.NODE_ENV === 'development'

const ONE_MINUTE = 1000 * 60
const ONE_DAY = 1000 * 60 * 60 * 24

export default ({ env }) => ({
  'dynamic-enumeration': {
    enabled: true,
    config: {
      contentTypeVisible: false,
      globals: {
        'form-input-name': {
          name: 'Input Name',
        },
      },
    },
  },
  'futurebrand-strapi-helpers': {
    enabled: true,
    config: {
      frontendUrl: env('APP_FRONTEND_URL', 'http://localhost:3000'),
      previewSecret: env('JWT_SECRET', crypto.randomBytes(24).toString('hex')),
      cacheRevalidate: isDev ? 0 : ONE_MINUTE,
      cacheMaxDuration: isDev ? 0 : ONE_DAY,
    },
  },
})
