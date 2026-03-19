'use client'

import { useRouter } from 'next/navigation'

import { useB2BSession } from '../hooks/useB2BSession'

interface CycleInfo {
  id: string
  label: string
  starts_at?: string
  ends_at?: string
}

interface B2BHeaderComponentProps {
  cycleId?: string | null
  onCycleChange?: (cycleId: string) => void
  hasValidGro?: boolean
  complianceCycle?: { label: string } | null
  complianceUpdatedAt?: string | null
  companyNameOverride?: string | null
  cyclesOverride?: CycleInfo[]
  currentCycleOverride?: CycleInfo | null
  hideSignOut?: boolean
}

export function B2BHeaderComponent({
  cycleId,
  onCycleChange,
  hasValidGro = false,
  complianceCycle,
  complianceUpdatedAt,
  companyNameOverride,
  cyclesOverride,
  currentCycleOverride,
  hideSignOut = false,
}: B2BHeaderComponentProps) {
  const router = useRouter()
  const session = useB2BSession()

  const companyName = companyNameOverride ?? session.companyName
  const cycles = cyclesOverride ?? session.cycles
  const currentCycle = currentCycleOverride ?? session.currentCycle

  const activeCycleId = cycleId ?? currentCycle?.id
  const cycleLabel = complianceCycle?.label ?? currentCycle?.label ?? '–'
  const updatedDate = complianceUpdatedAt
    ? new Date(complianceUpdatedAt).toLocaleDateString('pt-BR')
    : currentCycle?.ends_at
      ? new Date(currentCycle.ends_at).toLocaleDateString('pt-BR')
      : '–'

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/pt-BR/empresa/login')
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-6 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D9488] text-[18px]">
          🧠
        </div>
        <div>
          <div className="text-[15px] font-semibold text-[#E2E8F0]">Bright Precision</div>
          <div className="text-[11px] text-[#64748B]">Plataforma de Saúde Mental Cognitiva</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[#64748B]">Empresa:</span>
        <span className="text-[13px] font-semibold text-[#14B8A6]">{companyName ?? 'Empresa'}</span>
        {cycles.length > 0 && (
          <select
            value={activeCycleId ?? ''}
            onChange={(e) => onCycleChange?.(e.target.value)}
            className="ml-2 rounded-md border border-[rgba(255,255,255,0.08)] bg-[#132540] px-2 py-1 text-[12px] text-[#E2E8F0] focus:border-[#14B8A6] focus:outline-none"
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[#64748B]">
          Ciclo: {cycleLabel} · Atualizado {updatedDate}
        </span>
        {hasValidGro ? (
          <span
            className="rounded-[20px] px-3 py-1 text-[12px] font-medium"
            style={{
              background: 'rgba(16,185,129,0.15)',
              color: '#34D399',
              border: '1px solid rgba(16,185,129,0.3)',
            }}
          >
            ✓ GRO Emitido · NR-1 Conforme
          </span>
        ) : (
          <span
            className="rounded-[20px] px-3 py-1 text-[12px] font-medium"
            style={{
              background: 'rgba(245,158,11,0.15)',
              color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            ⚠ GRO Pendente
          </span>
        )}
        {!hideSignOut && (
          <button
            onClick={handleSignOut}
            className="text-[12px] text-[#94A3B8] hover:text-[#E2E8F0]"
          >
            Sair
          </button>
        )}
      </div>
    </header>
  )
}
