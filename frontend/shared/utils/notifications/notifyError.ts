/**
 * Error notification helper. Posts directly to Slack via the HowTheF Assistant
 * bot's `chat:write` scope (no incoming webhook, no n8n). Falls back to a
 * generic Slack Incoming Webhook URL if `SLACK_BOT_TOKEN` is not set.
 *
 * Required env vars (production):
 *   SLACK_BOT_TOKEN       — `xoxb-...` Bot User OAuth Token from Slack app settings.
 *   SLACK_ERROR_CHANNEL   — channel name ("howthef-errors") or channel ID ("C01234567").
 *                           Default: "howthef-errors". Bot must be a member
 *                           (`/invite @HowTheF AI` in the channel once).
 *
 * Optional fallback:
 *   SLACK_WEBHOOK_URL     — Slack Incoming Webhook URL. Only used if SLACK_BOT_TOKEN is missing.
 *
 * No-ops silently if nothing is configured (e.g. local dev). Never throws —
 * notification failures must not mask the original error.
 */

export interface ErrorNotification {
  /** Short human label, e.g. "PGR generation failed" */
  title: string
  /** Optional route or feature, e.g. "/api/brightmonitor/.../reports/pgr/inventario" */
  route?: string
  /** Free-form error message */
  message: string
  /** Optional structured context (companyId, slug, userId, etc.) */
  context?: Record<string, unknown>
  /** Optional error stack */
  stack?: string
}

const ENV = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
const DEPLOY_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : ''
const DEFAULT_CHANNEL = 'howthef-errors'
/**
 * Which app emitted the error. Override with `PROJECT_NAME` env var if this
 * helper is reused across projects. Defaults to Bright Brains so notifications
 * are unambiguous when multiple HowTheF apps post into the same channel.
 */
const PROJECT_NAME = process.env.PROJECT_NAME ?? 'Bright Brains'
/** Emoji prefix per environment so you can scan the channel quickly. */
const ENV_EMOJI: Record<string, string> = {
  production: '🔴',
  preview: '🟡',
  development: '🟢',
}

/**
 * Build Slack Block Kit blocks (used by both chat.postMessage and webhooks).
 * Block Kit gives nicer formatting than plain attachments and is what the bot
 * SDKs prefer.
 */
function buildBlocks(n: ErrorNotification) {
  const envEmoji = ENV_EMOJI[ENV] ?? '⚪'
  const contextParts = [
    `*Project:* \`${PROJECT_NAME}\``,
    `*Env:* ${envEmoji} \`${ENV}\``,
  ]
  if (DEPLOY_URL) contextParts.push(`*Deploy:* ${DEPLOY_URL}`)
  contextParts.push(
    `*When:* <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} {time}|${new Date().toISOString()}>`
  )

  const blocks: unknown[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🚨 [${PROJECT_NAME}] ${n.title}`.slice(0, 150),
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '```' + n.message.slice(0, 2800) + '```',
      },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: contextParts.join('   •   ') }],
    },
  ]

  if (n.route) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Route:* \`${n.route}\`` },
    })
  }

  if (n.context && Object.keys(n.context).length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '*Context:*\n```' +
          JSON.stringify(n.context, null, 2).slice(0, 2800) +
          '```',
      },
    })
  }

  if (n.stack) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Stack:*\n```' + n.stack.slice(0, 2800) + '```',
      },
    })
  }

  return blocks
}

async function postViaBotToken(
  token: string,
  channel: string,
  n: ErrorNotification
) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel,
      // Plain-text fallback for notifications/screen readers/threads.
      text: `🚨 [${PROJECT_NAME}] ${n.title}: ${n.message.slice(0, 300)}`,
      blocks: buildBlocks(n),
      unfurl_links: false,
      unfurl_media: false,
    }),
    signal: AbortSignal.timeout(5_000),
  })
  // Slack always returns 200 with `{ok: false, error: '...'}` on auth/channel issues.
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
  }
  if (!body.ok) {
    console.error(
      '[notifyError] Slack chat.postMessage failed:',
      body.error ?? 'unknown_error',
      `(channel: ${channel})`
    )
  }
}

async function postViaWebhook(url: string, n: ErrorNotification) {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 [${PROJECT_NAME}] ${n.title}: ${n.message.slice(0, 300)}`,
      blocks: buildBlocks(n),
    }),
    signal: AbortSignal.timeout(5_000),
  }).catch((err) => {
    console.error('[notifyError] Slack webhook post failed:', err)
  })
}

export async function notifyError(n: ErrorNotification): Promise<void> {
  const botToken = process.env.SLACK_BOT_TOKEN
  const channel = process.env.SLACK_ERROR_CHANNEL || DEFAULT_CHANNEL
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!botToken && !webhookUrl) return

  try {
    if (botToken) {
      await postViaBotToken(botToken, channel, n)
    } else if (webhookUrl) {
      await postViaWebhook(webhookUrl, n)
    }
  } catch (err) {
    // Never let a notification failure mask the original error.
    console.error('[notifyError] unexpected:', err)
  }
}
