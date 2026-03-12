'use client'

import type { EvaluationDetail } from '../portal.interface'

interface TimelineEvent {
  date: string
  label: string
  detail?: string
  color: 'teal' | 'amber' | 'green' | 'red' | 'blue'
}

function buildTimeline(evaluation: EvaluationDetail): TimelineEvent[] {
  const events: TimelineEvent[] = []

  events.push({
    date: evaluation.created_at,
    label: 'Avaliação criada',
    detail: `Paciente: ${evaluation.patient_name ?? '—'}`,
    color: 'blue',
  })

  const history = evaluation.form_data_history ?? []
  for (const entry of history) {
    events.push({
      date: entry.timestamp,
      label: `Dados editados por ${entry.changed_by}`,
      detail: `Campos: ${entry.changed_fields.join(', ')}`,
      color: 'teal',
    })
  }

  const reportHistory = evaluation.report_history ?? []
  for (let i = 0; i < reportHistory.length; i++) {
    events.push({
      date: reportHistory[i].generated_at,
      label: `Relatório v${i + 1} arquivado`,
      detail: reportHistory[i].report_pdf_url ? 'PDF disponível' : undefined,
      color: 'amber',
    })
  }

  if (evaluation.report_markdown && reportHistory.length > 0) {
    events.push({
      date: new Date().toISOString(),
      label: `Relatório v${reportHistory.length + 1} gerado (atual)`,
      color: 'amber',
    })
  }

  if (evaluation.reviewer_status === 'approved' && evaluation.approved_at) {
    events.push({
      date: evaluation.approved_at,
      label: 'Avaliação aprovada',
      detail: evaluation.approved_by
        ? `Por: ${evaluation.approved_by}`
        : undefined,
      color: 'green',
    })
  }

  if (evaluation.reviewer_status === 'rejected' && evaluation.reviewer_notes) {
    events.push({
      date: evaluation.approved_at ?? evaluation.created_at,
      label: 'Avaliação rejeitada',
      detail: evaluation.reviewer_notes,
      color: 'red',
    })
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return events
}

const COLOR_MAP = {
  teal: { dot: 'bg-[#00c9b1]', line: 'border-[#00c9b1]/30', text: 'text-[#00c9b1]' },
  amber: { dot: 'bg-[#f0a030]', line: 'border-[#f0a030]/30', text: 'text-[#f0a030]' },
  green: { dot: 'bg-[#22c55e]', line: 'border-[#22c55e]/30', text: 'text-[#22c55e]' },
  red: { dot: 'bg-[#ff4d6d]', line: 'border-[#ff4d6d]/30', text: 'text-[#ff4d6d]' },
  blue: { dot: 'bg-[#3b82f6]', line: 'border-[#3b82f6]/30', text: 'text-[#3b82f6]' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ActivityTimelineComponentProps {
  evaluation: EvaluationDetail
}

export function ActivityTimelineComponent({
  evaluation,
}: ActivityTimelineComponentProps) {
  const events = buildTimeline(evaluation)

  if (events.length === 0) {
    return (
      <p className="text-sm text-[#5a7fa0]">Nenhuma atividade registrada.</p>
    )
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, i) => {
        const c = COLOR_MAP[event.color]
        const isLast = i === events.length - 1

        return (
          <div key={`${event.date}-${i}`} className="flex gap-4">
            {/* Timeline rail */}
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full ${c.dot}`} />
              {!isLast && (
                <div className="w-px flex-1 border-l-2 border-dashed border-[#1a3a5c]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p className="text-xs text-[#3a5a75]">
                {formatDateTime(event.date)}
              </p>
              <p className={`mt-0.5 text-sm font-medium ${c.text}`}>
                {event.label}
              </p>
              {event.detail && (
                <p className="mt-0.5 text-xs text-[#5a7fa0]">{event.detail}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
