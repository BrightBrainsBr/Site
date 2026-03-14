export type ProcessReportMode = 'submit' | 'regenerate'

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.SITE_URL || 'http://localhost:3000'
}

export async function triggerProcessReportJob(args: {
  evaluationId: string
  mode: ProcessReportMode
  requestId: string
  source: string
}): Promise<void> {
  const { evaluationId, mode, requestId, source } = args

  const url = `${getBaseUrl()}/api/assessment/process-report`
  const secret = process.env.REPORT_JOBS_SECRET
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (secret) headers['x-report-job-secret'] = secret

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ evaluationId, mode }),
    })
    if (!res.ok && res.status !== 202) {
      console.error(
        `[${source}:${requestId}] process-report failed: ${res.status} ${await res.text()}`
      )
    }
  } catch (error) {
    console.error(
      `[${source}:${requestId}] process-report fetch failed:`,
      error
    )
  }
}
