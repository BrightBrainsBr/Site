export type ProcessReportMode = 'submit' | 'regenerate'

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.SITE_URL || 'http://localhost:3000'
}

const TRIGGER_TIMEOUT_MS = 15_000

export async function triggerProcessReportJob(args: {
  evaluationId: string
  mode: ProcessReportMode
  requestId: string
  source: string
}): Promise<{ ok: boolean; detail?: string }> {
  const { evaluationId, mode, requestId, source } = args

  const url = `${getBaseUrl()}/api/assessment/process-report`
  const secret = process.env.REPORT_JOBS_SECRET
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (secret) headers['x-report-job-secret'] = secret

  console.warn(
    `[${source}:${requestId}] Triggering process-report | url=${url} | id=${evaluationId} | mode=${mode}`
  )

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TRIGGER_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ evaluationId, mode }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    const text = await res.text()
    if (!res.ok && res.status !== 202) {
      console.error(
        `[${source}:${requestId}] process-report returned ${res.status}: ${text}`
      )
      return { ok: false, detail: `${res.status}: ${text}` }
    }

    console.warn(
      `[${source}:${requestId}] process-report acknowledged: ${res.status} ${text}`
    )
    return { ok: true, detail: text }
  } catch (error) {
    clearTimeout(timer)
    const msg = error instanceof Error ? error.message : String(error)
    console.error(
      `[${source}:${requestId}] process-report fetch failed: ${msg}`
    )
    return { ok: false, detail: msg }
  }
}
