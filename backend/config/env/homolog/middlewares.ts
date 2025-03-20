module.exports = ({ env }) => [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': [
            "'self'",
            'https:',
            'http:',
            "'unsafe-inline'",
            'unsafe-eval',
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            env('AWS_CDN_URL'),
            `${env('AWS_BUCKET')}.s3.${env('AWS_REGION')}.amazonaws.com`,
            `${env('AWS_BUCKET')}.s3.amazonaws.com`,
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            env('AWS_CDN_URL'),
            `${env('AWS_BUCKET')}.s3.${env('AWS_REGION')}.amazonaws.com`,
            `${env('AWS_BUCKET')}.s3.amazonaws.com`,
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
]
