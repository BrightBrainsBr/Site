// frontend/features/portal/helpers/format-evaluation.ts

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function daysAgo(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'hoje'
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `${diffDays}d atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem atrás`
  return formatDate(iso)
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_review: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  }
  return labels[status] ?? status
}

export function getProcessingStatusLabel(
  status: string | null | undefined
): string | null {
  if (!status) return null
  if (status.startsWith('processing_dispatching_'))
    return '⏳ Inicializando processamento...'
  if (status.startsWith('processing_claimed_'))
    return '⚙️ Worker iniciado, preparando...'
  if (status.startsWith('processing_report_'))
    return '🧠 Conectando com IA...'

  if (status.startsWith('processing_extract_')) {
    const match = status.match(/processing_extract_(\d+)_of_(\d+)/)
    if (match) return `📄 Extraindo documento ${match[1]} de ${match[2]}...`
    return '📄 Extraindo documentos...'
  }
  if (status.startsWith('processing_stage_')) {
    return '🧠 Gerando relatório completo...'
  }

  const labels: Record<string, string> = {
    processing: '⏳ Processando...',
    processing_report: '🧠 Gerando relatório...',
    processing_pdf: '📝 Gerando PDF...',
    processing_upload: '☁️ Salvando PDF...',
    processing_notify: '📧 Enviando notificação...',
    completed: '✅ Completo',
    error: '❌ Erro no processamento',
  }
  return labels[status] ?? null
}

export function getProfileLabel(profile: string): string {
  const labels: Record<string, string> = {
    adulto: 'Adulto',
    infantil: 'Infantil',
    neuro: 'Neuro',
    executivo: 'Executivo',
    longevidade: 'Longevidade',
  }
  return labels[profile] ?? profile
}
