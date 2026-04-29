// frontend/features/b2b-dashboard/components/tabs/B2BAlertsTab.tsx
'use client'

import type { B2BAlertData } from '../../b2b-dashboard.interface'
import { useB2BAlerts } from '../../hooks/useB2BAlerts'

interface Props {
  companyId: string | null
  cycleId: string | null
}

const SEVERITY_CONFIG: Record<
  B2BAlertData['severity'],
  { label: string; color: string; dotColor: string }
> = {
  critico: {
    label: 'Crítico',
    color: '#ef4444',
    dotColor: '#ef4444',
  },
  alto: {
    label: 'Alto',
    color: '#f97316',
    dotColor: '#f97316',
  },
  moderado: {
    label: 'Moderado',
    color: '#eab308',
    dotColor: '#eab308',
  },
}

const TYPE_ICONS: Record<B2BAlertData['type'], string> = {
  critical_dept: '⚠️',
  violence_dept: '🚨',
  incident: '📋',
  harassment: '🔴',
}

export function B2BAlertsTab({ companyId, cycleId }: Props) {
  const { data, isLoading, isError } = useB2BAlerts(companyId, cycleId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[15px] text-[#64748b]">
        Carregando alertas…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-[15px] text-[#F87171]">
        Erro ao carregar alertas
      </div>
    )
  }

  const alerts = data?.alerts ?? []

  const criticalAlerts = alerts.filter((a) => a.severity === 'critico')
  const highAlerts = alerts.filter((a) => a.severity === 'alto')
  const moderateAlerts = alerts.filter((a) => a.severity === 'moderado')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">🔔</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">Alertas e Pendências</h2>
          <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[12px] font-semibold text-[#94a3b8]">
            Automático
          </span>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Alertas gerados automaticamente com base nos dados do ciclo atual
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425]">
          <span className="text-[32px]">✅</span>
          <p className="text-[15px] font-semibold text-[#e2e8f0]">Nenhum alerta ativo</p>
          <p className="text-[13px] text-[#64748b]">Todos os indicadores estão dentro dos parâmetros normais</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary counters — neutral cards with colored numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-3 text-center">
              <p className="text-[28px] font-bold text-[#e2e8f0]">{criticalAlerts.length}</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[12px] text-[#64748b]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#ef4444]" />
                Críticos
              </p>
            </div>
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-3 text-center">
              <p className="text-[28px] font-bold text-[#e2e8f0]">{highAlerts.length}</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[12px] text-[#64748b]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" />
                Alto
              </p>
            </div>
            <div className="rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-3 text-center">
              <p className="text-[28px] font-bold text-[#e2e8f0]">{moderateAlerts.length}</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[12px] text-[#64748b]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#eab308]" />
                Moderado
              </p>
            </div>
          </div>

          {/* Alert list */}
          <div className="space-y-1.5">
            {alerts.map((alert, idx) => {
              const cfg = SEVERITY_CONFIG[alert.severity]
              const icon = TYPE_ICONS[alert.type]
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3"
                >
                  <span className="mt-0.5 shrink-0 text-[16px]">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#c8d0dc]">{alert.message}</p>
                    {alert.department && (
                      <p className="mt-0.5 text-[12px] text-[#64748b]">
                        Setor: {alert.department}
                      </p>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ color: cfg.color, backgroundColor: `${cfg.dotColor}1a` }}
                  >
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
