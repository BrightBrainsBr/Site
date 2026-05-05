#!/usr/bin/env node
/**
 * Standalone test for the notifyError helper. Posts a fake "test" error to
 * #howthef-errors so you can verify Slack wiring before deploying.
 *
 * Usage:
 *   SLACK_BOT_TOKEN=xoxb-... node frontend/scripts/test-slack-error.mjs
 *
 * Optional overrides:
 *   SLACK_ERROR_CHANNEL=howthef-errors   (default)
 *   PROJECT_NAME='Bright Brains'         (default)
 *   VERCEL_ENV=production                (default: 'test')
 *
 * This script intentionally does NOT import the TypeScript helper (so you
 * don't need a build step) — it inlines the same Block Kit payload. Keep them
 * in sync if you change buildBlocks().
 */

const TOKEN = process.env.SLACK_BOT_TOKEN
const CHANNEL = process.env.SLACK_ERROR_CHANNEL || 'howthef-errors'
const PROJECT_NAME = process.env.PROJECT_NAME || 'Bright Brains'
const ENV = process.env.VERCEL_ENV || process.env.NODE_ENV || 'test'

if (!TOKEN) {
  console.error(
    'ERROR: SLACK_BOT_TOKEN env var is required.\n' +
      'Get the xoxb-... token from Slack app → OAuth & Permissions → Bot User OAuth Token.\n\n' +
      'Then run:\n' +
      '  SLACK_BOT_TOKEN=xoxb-... node frontend/scripts/test-slack-error.mjs'
  )
  process.exit(1)
}

const ENV_EMOJI = { production: '🔴', preview: '🟡', development: '🟢' }
const envEmoji = ENV_EMOJI[ENV] ?? '⚪'

const fakeError = {
  title: '🧪 Test notification (you can ignore)',
  route: '/api/_test/slack-notification',
  message:
    'This is a test error fired from frontend/scripts/test-slack-error.mjs.\n' +
    'If you can read this in #howthef-errors, the wiring works — go set ' +
    'SLACK_BOT_TOKEN in Vercel for Production and you are done.',
  context: {
    project: PROJECT_NAME,
    triggeredBy: 'manual test script',
    timestamp: new Date().toISOString(),
  },
  stack:
    'TestError: this is a fake stack\n' +
    '    at testNotification (test-slack-error.mjs:1:1)\n' +
    '    at Object.<anonymous> (test-slack-error.mjs:42:42)',
}

const contextParts = [
  `*Project:* \`${PROJECT_NAME}\``,
  `*Env:* ${envEmoji} \`${ENV}\``,
  `*When:* <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} {time}|${new Date().toISOString()}>`,
]

const blocks = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: `🚨 [${PROJECT_NAME}] ${fakeError.title}`.slice(0, 150),
      emoji: true,
    },
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: '```' + fakeError.message + '```' },
  },
  {
    type: 'context',
    elements: [{ type: 'mrkdwn', text: contextParts.join('   •   ') }],
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: `*Route:* \`${fakeError.route}\`` },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text:
        '*Context:*\n```' + JSON.stringify(fakeError.context, null, 2) + '```',
    },
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: '*Stack:*\n```' + fakeError.stack + '```' },
  },
]

console.log(`→ Posting test error to #${CHANNEL} as project="${PROJECT_NAME}"…`)

const res = await fetch('https://slack.com/api/chat.postMessage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify({
    channel: CHANNEL,
    text: `🚨 [${PROJECT_NAME}] ${fakeError.title}: ${fakeError.message.slice(0, 200)}`,
    blocks,
    unfurl_links: false,
    unfurl_media: false,
  }),
})

const body = await res.json()

if (body.ok) {
  console.log(`✅ Posted! channel=${body.channel} ts=${body.ts}`)
  console.log(`   Open: https://app.slack.com/client/-/-/${body.channel}`)
  process.exit(0)
} else {
  console.error(`❌ Slack error: ${body.error || 'unknown'}`)
  if (body.error === 'not_in_channel') {
    console.error(
      `   The bot is not a member of #${CHANNEL}. In Slack run:\n` +
        `     /invite @HowTheF AI\n   inside #${CHANNEL}, then re-run this script.`
    )
  } else if (body.error === 'channel_not_found') {
    console.error(
      `   Channel "#${CHANNEL}" not found. Check the SLACK_ERROR_CHANNEL env var ` +
        `(use the channel name without # or the channel ID).`
    )
  } else if (body.error === 'invalid_auth' || body.error === 'not_authed') {
    console.error(
      '   The SLACK_BOT_TOKEN is invalid. Re-copy the "Bot User OAuth Token" (xoxb-...) ' +
        'from Slack app → OAuth & Permissions.'
    )
  } else if (body.error === 'missing_scope') {
    console.error(
      `   Bot is missing a required scope. Needed: chat:write. Got: ${body.needed ?? '?'}/${body.provided ?? '?'}`
    )
  }
  process.exit(1)
}
