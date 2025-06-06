module.exports = ({ env }) => ({
  // upload: {
  //   config: {
  //     provider: 'aws-s3',
  //     providerOptions: {
  //       baseUrl: env('AWS_CDN_URL'),
  //       rootPath: env('AWS_CDN_ROOT_PATH'),
  //       s3Options: {
  //         credentials: {
  //           accessKeyId: env('AWS_ACCESS_KEY_ID'),
  //           secretAccessKey: env('AWS_ACCESS_SECRET'),
  //         },
  //         region: env('AWS_REGION'),
  //         params: {
  //           ACL: env('AWS_ACL', 'public-read'),
  //           Bucket: env('AWS_BUCKET'),
  //         },
  //       },
  //     },
  //     actionOptions: {
  //       upload: {},
  //       uploadStream: {},
  //       delete: {},
  //     },
  //   },
  // },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env('SMTP_PORT', 465),
        auth: {
          user: env('SMTP_USERNAME', 'email@gmail.com'),
          pass: env('SMTP_PASSWORD', 'password'),
        },
      },
      settings: {
        defaultFrom: env('SMTP_FROM', 'no-reply@futurebrand.com.br'),
        defaultReplyTo: env('SMTP_REPLY_TO', 'no-reply@futurebrand.com.br'),
      },
    },
  },
  placeholder: {
    enabled: true,
    config: {
      size: 10,
    },
  },
})
