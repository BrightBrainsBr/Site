'use client'

import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { useB2BLocaleHook } from '../hooks/useB2BLocaleHook'
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
  userEmailOverride?: string | null
  onSettingsClick?: () => void
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
  userEmailOverride,
  onSettingsClick,
}: B2BHeaderComponentProps) {
  const router = useRouter()
  const { localePath } = useB2BLocaleHook()
  const session = useB2BSession()

  const companyName = companyNameOverride ?? session.companyName
  const cycles = cyclesOverride ?? session.cycles
  const currentCycle = currentCycleOverride ?? session.currentCycle
  const userEmail = userEmailOverride ?? session.userEmail

  const activeCycleId = cycleId ?? currentCycle?.id
  const cycleLabel = complianceCycle?.label ?? currentCycle?.label ?? '–'
  const updatedDate = complianceUpdatedAt
    ? new Date(complianceUpdatedAt).toLocaleDateString('pt-BR')
    : currentCycle?.ends_at
      ? new Date(currentCycle.ends_at).toLocaleDateString('pt-BR')
      : '–'

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push(localePath('/login'))
    router.refresh()
  }

  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : '?'

  return (
    <header className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-6 py-3">
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D9488] text-[18px]">
          🧠
        </div>
        <div>
          <div className="text-[15px] font-semibold text-[#E2E8F0]">
            Bright Precision
          </div>
          <div className="text-[11px] text-[#64748B]">
            Plataforma de Saúde Mental Cognitiva
          </div>
        </div>
      </div>

      {/* Center: Company + Cycle */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[#64748B]">Empresa:</span>
        <span className="text-[13px] font-semibold text-[#14B8A6]">
          {companyName ?? 'Empresa'}
        </span>
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

      {/* Right: Date, Badge, User Menu */}
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

        {/* User Dropdown */}
        {!hideSignOut && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D9488]/30">
                <User className="h-4 w-4 text-[#14B8A6]" />
              </div>
              <ChevronDown
                className={`h-4 w-4 text-[#94A3B8] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#132540] py-2 shadow-xl">
                {userEmail && (
                  <div className="border-b border-[rgba(255,255,255,0.08)] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B]">
                      Conectado como
                    </p>
                    <p className="mt-0.5 truncate text-[13px] font-medium text-[#E2E8F0]">
                      {userEmail}
                    </p>
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      router.push(localePath('/empresa/perfil'))
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#E2E8F0]"
                  >
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </button>
                  {onSettingsClick && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        onSettingsClick()
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#E2E8F0]"
                    >
                      <Settings className="h-4 w-4" />
                      Configurações
                    </button>
                  )}
                </div>

                <div className="border-t border-[rgba(255,255,255,0.08)] pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[#F87171] transition-colors hover:bg-[rgba(239,68,68,0.06)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
