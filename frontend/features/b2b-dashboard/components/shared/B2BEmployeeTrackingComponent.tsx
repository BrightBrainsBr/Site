// frontend/features/b2b-dashboard/components/shared/B2BEmployeeTrackingComponent.tsx
'use client'

import type {
  B2BEmployeeTrackingData,
  EmployeeTrackingStatus,
} from '../../b2b-dashboard.interface'

interface B2BEmployeeTrackingComponentProps {
  data: B2BEmployeeTrackingData
}

const STATUS_CONFIG: Record<
  EmployeeTrackingStatus,
  { label: string; bg: string; text: string }
> = {
  pendente: {
    label: 'Pendente',
    bg: 'rgba(239,68,68,0.15)',
    text: '#F87171',
  },
  iniciou: {
    label: 'Iniciou',
    bg: 'rgba(245,158,11,0.15)',
    text: '#FBBF24',
  },
  completou: {
    label: 'Completou',
    bg: 'rgba(16,185,129,0.15)',
    text: '#34D399',
  },
}

function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '***@***'
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***'
  const visibleChars = Math.min(3, local.length)
  return `${local.slice(0, visibleChars)}***@${domain}`
}

export function B2BEmployeeTrackingComponent({
  data,
}: B2BEmployeeTrackingComponentProps) {
  const { total, completed, completionPct, byDepartment, employees } = data

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[rgba(245,158,11,0.15)] px-4 py-1.5 text-[15px] font-medium text-[#FBBF24]">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Aguardando avaliações
        </div>
        <h2 className="text-[20px] font-bold text-[#E2E8F0]">
          Coleta de Dados em Andamento
        </h2>
        <p className="mt-1 text-[15px] text-[#64748B]">
          O dashboard será liberado quando pelo menos 30% dos colaboradores
          completarem a avaliação.
        </p>
      </div>

      {/* Overall progress */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#E2E8F0]">
              Progresso Geral
            </p>
            <p className="text-[14px] text-[#64748B]">
              {completed} de {total} funcionários completaram ({completionPct}%)
            </p>
          </div>
          <span className="text-[28px] font-bold text-[#14B8A6]">
            {completionPct}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(completionPct, 1)}%`,
              background:
                completionPct >= 30
                  ? '#10B981'
                  : 'linear-gradient(90deg, #F59E0B, #FB923C)',
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[12px] text-[#64748B]">
          <span>0%</span>
          <span className="font-medium text-[#F59E0B]">30% mínimo</span>
          <span>100%</span>
        </div>
      </div>

      {/* Per-department progress */}
      {byDepartment.length > 0 && (
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
          <h3 className="mb-3 text-[15px] font-semibold text-[#E2E8F0]">
            Progresso por Departamento
          </h3>
          <div className="space-y-2.5">
            {byDepartment.map((dept) => {
              const pct =
                dept.total > 0
                  ? Math.round((dept.completed / dept.total) * 100)
                  : 0
              return (
                <div key={dept.name}>
                  <div className="mb-1 flex items-center justify-between text-[14px]">
                    <span className="text-[#94A3B8]">{dept.name}</span>
                    <span className="text-[#64748B]">
                      {dept.completed}/{dept.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div
                      className="h-full rounded-full bg-[#0D9488] transition-all duration-500"
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Employee table */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33]">
        <div className="px-5 pt-4">
          <h3 className="text-[15px] font-semibold text-[#E2E8F0]">
            Colaboradores
          </h3>
        </div>
        <table className="mt-2 w-full min-w-[500px] border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="px-5 py-2 text-left text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
                E-mail
              </th>
              <th className="px-5 py-2 text-left text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
                Departamento
              </th>
              <th className="px-5 py-2 text-left text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => {
              const cfg = STATUS_CONFIG[emp.status]
              return (
                <tr
                  key={i}
                  className="border-b border-[rgba(255,255,255,0.04)] last:border-0"
                >
                  <td className="px-5 py-2.5 font-mono text-[14px] text-[#94A3B8]">
                    {maskEmail(emp.email)}
                  </td>
                  <td className="px-5 py-2.5 text-[#94A3B8]">
                    {emp.department}
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
                      style={{ backgroundColor: cfg.bg, color: cfg.text }}
                    >
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {employees.length === 0 && (
          <p className="py-8 text-center text-[15px] text-[#64748B]">
            Nenhum colaborador cadastrado.
          </p>
        )}
      </div>

      {/* Disabled reminder button */}
      <div className="flex justify-center">
        <button
          disabled
          className="cursor-not-allowed rounded-lg bg-[rgba(255,255,255,0.06)] px-5 py-2.5 text-[15px] font-medium text-[#64748B]"
          title="Funcionalidade em breve"
        >
          Enviar lembrete (em breve)
        </button>
      </div>
    </div>
  )
}
