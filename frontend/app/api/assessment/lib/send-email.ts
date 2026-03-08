const DEFAULT_WEBHOOK_URL =
  'https://n8n-webhook-clients-1.fluxosai.com.br/webhook/1aaf11cc-7708-4162-a82e-0b015ecc14d9'

const REPORT_WEBHOOK_URL =
  process.env.N8N_REPORT_WEBHOOK_URL ||
  process.env.REPORT_WEBHOOK_URL ||
  DEFAULT_WEBHOOK_URL

const ERROR_WEBHOOK_URL =
  process.env.N8N_ERROR_WEBHOOK_URL ||
  process.env.ERROR_WEBHOOK_URL ||
  REPORT_WEBHOOK_URL

function formatDate(date: Date = new Date()): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

async function postWebhook(
  url: string | undefined,
  payload: Record<string, unknown>,
  label: string
): Promise<boolean> {
  if (!url) {
    console.warn(`[webhook] ${label} skipped: webhook URL not configured`)
    return false
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const responseText = await res.text().catch(() => '')
    if (!res.ok) {
      console.error(
        `[webhook] ${label} failed: ${res.status} ${res.statusText} | body=${responseText}`
      )
      return false
    }

    console.warn(`[webhook] ${label} sent successfully`)
    return true
  } catch (error) {
    console.error(`[webhook] ${label} request failed:`, error)
    return false
  }
}

export async function sendReportEmail(opts: {
  patientName: string
  pdfUrl: string
  evaluationId: string
  patientEmail?: string
  patientPhone?: string
  patientProfile?: string
}): Promise<boolean> {
  const date = formatDate()
  const subject = `[Bright Precision] ${opts.patientName} — ${date}`
  return postWebhook(
    REPORT_WEBHOOK_URL,
    {
      event: 'assessment_report_ready',
      subject,
      generated_at: new Date().toISOString(),
      evaluation_id: opts.evaluationId,
      name: opts.patientName,
      email: opts.patientEmail ?? null,
      phone: opts.patientPhone ?? null,
      profile: opts.patientProfile ?? null,
      patient_name: opts.patientName,
      patient_email: opts.patientEmail ?? null,
      patient_phone: opts.patientPhone ?? null,
      patient_profile: opts.patientProfile ?? null,
      report_url: opts.pdfUrl,
      supabase_link: opts.pdfUrl,
      report_pdf_url: opts.pdfUrl,
    },
    'report'
  )
}

export async function sendErrorEmail(opts: {
  patientName: string
  evaluationId: string
  errorMessage: string
  patientEmail?: string
  patientPhone?: string
  patientProfile?: string
}): Promise<boolean> {
  const date = formatDate()
  const subject = `[ERRO - Bright Precision] ${opts.patientName} — ${date}`
  return postWebhook(
    ERROR_WEBHOOK_URL,
    {
      event: 'assessment_report_error',
      subject,
      generated_at: new Date().toISOString(),
      evaluation_id: opts.evaluationId,
      name: opts.patientName,
      email: opts.patientEmail ?? null,
      phone: opts.patientPhone ?? null,
      profile: opts.patientProfile ?? null,
      patient_name: opts.patientName,
      patient_email: opts.patientEmail ?? null,
      patient_phone: opts.patientPhone ?? null,
      patient_profile: opts.patientProfile ?? null,
      error_message: opts.errorMessage,
    },
    'error'
  )
}
