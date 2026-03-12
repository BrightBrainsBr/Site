// frontend/features/portal/components/EvaluationListViewComponent.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'

import { cn } from '~/shared/utils/cn'
import type { EvaluationListItem } from '../portal.interface'
import { formatDate } from '../helpers/format-evaluation'
import { useEvaluationsQueryHook } from '../hooks/useEvaluationsQueryHook'
import { ProfileBadgeComponent } from './ProfileBadgeComponent'
import { StatusBadgeComponent } from './StatusBadgeComponent'

const PROFILES = [
  { value: '', label: 'Todos', dot: '#5a7fa0' },
  { value: 'adulto', label: 'Adulto', dot: '#93c5fd' },
  { value: 'infantil', label: 'Infantil', dot: '#6ee7b7' },
  { value: 'neuro', label: 'Neuro', dot: '#c4b5fd' },
  { value: 'executivo', label: 'Executivo', dot: '#fcd34d' },
  { value: 'longevidade', label: 'Longevidade', dot: '#fdba74' },
] as const

const STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'pending_review', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
] as const

function countByProfile(list: EvaluationListItem[]) {
  const counts: Record<string, number> = {}
  for (const p of PROFILES) {
    if (p.value === '') {
      counts[''] = list.length
    } else {
      counts[p.value] = list.filter((e) => e.patient_profile === p.value).length
    }
  }
  return counts
}

function countByStatus(list: EvaluationListItem[]) {
  const counts: Record<string, number> = {}
  for (const s of STATUSES) {
    if (s.value === '') {
      counts[''] = list.length
    } else {
      counts[s.value] = list.filter((e) => e.reviewer_status === s.value).length
    }
  }
  return counts
}

function daysAgoShort(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'hoje'
  if (diffDays === 1) return '1d atrás'
  return `${diffDays}d atrás`
}

export function EvaluationListViewComponent() {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'pt'
  const [status, setStatus] = useQueryState('status', parseAsString)
  const [profile, setProfile] = useQueryState('profile', parseAsString)
  const [search, setSearch] = useQueryState('search', parseAsString)
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsString.withDefault('date_desc')
  )

  const { data: evaluations = [], isLoading } = useEvaluationsQueryHook({
    status: status ?? undefined,
    profile: profile ?? undefined,
    search: search ?? undefined,
    sort: sort ?? 'date_desc',
  })

  const profileCounts = countByProfile(evaluations)
  const statusCounts = countByStatus(evaluations)

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-64 overflow-y-auto border-r border-[#1a3a5c] bg-[#0c1a2e] p-6">
        <section className="mb-6">
          <h2 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[2px] text-[#3a5a75]">
            Perfil Clínico
          </h2>
          <div className="space-y-0.5">
            {PROFILES.map((p) => (
              <button
                key={p.value || 'all'}
                type="button"
                onClick={() => setProfile(p.value || null)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  (profile ?? '') === p.value
                    ? 'bg-[rgba(0,201,177,0.12)] text-[#00c9b1]'
                    : 'text-[#5a7fa0] hover:bg-[#0f2240] hover:text-[#cce6f7]'
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: p.dot }}
                />
                <span>{p.label}</span>
                <span className="ml-auto font-mono text-[11px] font-normal">
                  <span className="rounded-full bg-[#0f2240] px-1.5 py-0.5">
                    {profileCounts[p.value] ?? 0}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[2px] text-[#3a5a75]">
            Status
          </h2>
          <div className="space-y-0.5">
            {STATUSES.map((s) => (
              <button
                key={s.value || 'all'}
                type="button"
                onClick={() => setStatus(s.value || null)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  (status ?? '') === s.value
                    ? 'bg-[rgba(0,201,177,0.12)] text-[#00c9b1]'
                    : 'text-[#5a7fa0] hover:bg-[#0f2240] hover:text-[#cce6f7]'
                )}
              >
                <span>{s.label}</span>
                <span className="ml-auto font-mono text-[11px] font-normal">
                  <span className="rounded-full bg-[#0f2240] px-1.5 py-0.5">
                    {statusCounts[s.value] ?? 0}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7fa0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              value={search ?? ''}
              onChange={(e) => setSearch(e.target.value || null)}
              placeholder="Buscar paciente..."
              className="w-full rounded-lg border border-[#1a3a5c] bg-[#0c1a2e] py-2.5 pl-10 pr-3 text-[#cce6f7] placeholder-[#3a5a75] transition-colors focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSort('date_desc')}
              className={cn(
                'rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                (sort ?? 'date_desc') === 'date_desc'
                  ? 'border-[#00c9b1] bg-[rgba(0,201,177,0.08)] text-[#00c9b1]'
                  : 'border-[#1a3a5c] bg-[#0c1a2e] text-[#5a7fa0] hover:border-[#234872]'
              )}
            >
              Data
            </button>
            <button
              type="button"
              onClick={() => setSort('name_asc')}
              className={cn(
                'rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                sort === 'name_asc'
                  ? 'border-[#00c9b1] bg-[rgba(0,201,177,0.08)] text-[#00c9b1]'
                  : 'border-[#1a3a5c] bg-[#0c1a2e] text-[#5a7fa0] hover:border-[#234872]'
              )}
            >
              Nome
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#1a3a5c]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#00c9b1]" />
            </div>
          ) : evaluations.length === 0 ? (
            <div className="py-16 text-center text-[#3a5a75]">
              Nenhuma avaliação encontrada
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#0f2240] text-[11px] font-semibold uppercase tracking-[1.5px] text-[#3a5a75]">
                  <th className="px-4 py-3 text-left">Paciente</th>
                  <th className="px-4 py-3 text-left">Perfil</th>
                  <th className="px-4 py-3 text-left">Data de Entrada</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">PDF</th>
                  <th className="px-4 py-3 text-left">Ação</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evaluation) => (
                  <tr
                    key={evaluation.id}
                    className="cursor-pointer border-b border-[#1a3a5c] transition-colors hover:bg-[rgba(0,201,177,0.05)]"
                    onClick={() => router.push(`/${locale}/portal/${evaluation.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-[#e8f4ff]">
                      {evaluation.patient_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {evaluation.patient_profile ? (
                        <ProfileBadgeComponent
                          profile={evaluation.patient_profile}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="font-mono text-xs text-[#5a7fa0]"
                        style={{ fontFamily: 'var(--font-mono-portal), monospace' }}
                      >
                        {formatDate(evaluation.created_at)}
                      </div>
                      <div className="text-[11px] text-[#3a5a75]">
                        {daysAgoShort(evaluation.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {evaluation.reviewer_status ? (
                        <StatusBadgeComponent
                          status={evaluation.reviewer_status}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {evaluation.report_pdf_url ? (
                        <a
                          href={evaluation.report_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00c9b1] hover:text-[#00e0c4]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-md border border-[rgba(0,201,177,0.3)] bg-[rgba(0,201,177,0.1)] px-3 py-1.5 text-xs font-medium text-[#00c9b1] transition-colors hover:bg-[rgba(0,201,177,0.15)]"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/${locale}/portal/${evaluation.id}`)
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
