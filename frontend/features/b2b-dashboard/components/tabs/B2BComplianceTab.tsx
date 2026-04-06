// frontend/features/b2b-dashboard/components/tabs/B2BComplianceTab.tsx
'use client'

import { useB2BCompliance } from '../../hooks/useB2BCompliance'

interface B2BComplianceTabProps {
  companyId: string | null
  cycleId: string | null
}

const STATUS_CONFIG = {
  conforme: {
    label: 'Conforme',
    bg: 'rgba(16,185,129,0.15)',
    text: '#34D399',
    icon: '✓',
  },
  parcial: {
    label: 'Parcial',
    bg: 'rgba(245,158,11,0.15)',
    text: '#FBBF24',
    icon: '◐',
  },
  pendente: {
    label: 'Pendente',
    bg: 'rgba(239,68,68,0.15)',
    text: '#F87171',
    icon: '✗',
  },
} as const

export function B2BComplianceTab({
  companyId,
  cycleId,
}: B2BComplianceTabProps) {
  const { data, isLoading } = useB2BCompliance(companyId, cycleId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c5e155] border-t-transparent" />
      </div>
    )
  }

  const items = data?.items ?? []
  const conformeCount = data?.conformeCount ?? 0
  const totalItems = data?.totalItems ?? 0
  const progressPct = totalItems > 0 ? Math.round((conformeCount / totalItems) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[18px]">✅</span>
          <h2 className="text-[18px] font-bold text-[#e2e8f0]">Compliance</h2>
        </div>
        <p className="mt-0.5 pl-[26px] text-[12px] text-[#64748b]">Portaria MTE 1.419/2024 — Status de conformidade por requisito</p>
      </div>

      {/* Score header */}
      <div
        className="rounded-[14px] border border-[rgba(255,255,255,0.06)] p-5"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-[11px] uppercase tracking-wider text-[#64748b]">
              Conformidade NR-1
            </p>
            <p className="mt-1 font-mono text-[36px] font-bold leading-none text-[#c5e155]">
              {conformeCount}
              <span className="text-[18px] font-normal text-[#64748b]">
                /{totalItems}
              </span>
            </p>
            <p className="mt-0.5 text-[13px] text-[#94a3b8]">
              itens conformes
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1 text-right text-[11px] text-[#64748b]">
              {progressPct}%
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #c5e155, #22c55e)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div
        className="rounded-[14px] border border-[rgba(255,255,255,0.06)] p-4"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <h3 className="mb-4 text-[13px] font-semibold text-[#e2e8f0]">
          Checklist de Conformidade
        </h3>
        {items.length > 0 ? (
          <div>
            {items.map((item) => {
              const cfg = STATUS_CONFIG[item.status]
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 border-b border-[rgba(255,255,255,0.06)] py-3 last:border-0"
                >
                  <div
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]"
                    style={{ backgroundColor: cfg.bg, color: cfg.text }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 rounded bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 font-mono text-[10px] text-[#c5e155]">
                        {item.ref}
                      </span>
                      <p className="text-[13px] text-[#e2e8f0]">
                        {item.description}
                      </p>
                    </div>
                    {item.detail && (
                      <p className="mt-0.5 text-[11px] text-[#64748b]">
                        {item.detail}
                      </p>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: cfg.bg, color: cfg.text }}
                  >
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-[13px] text-[#64748b]">
            Nenhum item de conformidade disponível para este ciclo.
          </p>
        )}
      </div>
    </div>
  )
}
