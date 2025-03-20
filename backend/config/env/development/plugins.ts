module.exports = ({ env }) => ({
  placeholder: {
    enabled: true,
    config: {
      size: 10,
    },
  },
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
})
