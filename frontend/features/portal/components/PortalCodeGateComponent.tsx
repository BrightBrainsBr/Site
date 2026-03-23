// frontend/features/portal/components/PortalCodeGateComponent.tsx
'use client'

import { useState } from 'react'

import { apiPost } from '~/shared/utils/api-helpers'

interface PortalCodeGateComponentProps {
  onSuccess: () => void
}

export function PortalCodeGateComponent({
  onSuccess,
}: PortalCodeGateComponentProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    try {
      const result = await apiPost<{ valid: boolean }>(
        '/api/portal/validate-code',
        { code }
      )

      if (result.success && result.data?.valid) {
        onSuccess()
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[#1a3a5c] bg-[#0c1a2e] p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00c9b1] to-[#0090ff]">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h1
              className="text-lg font-bold text-[#cce6f7]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Bright Brains
            </h1>
            <p className="text-[11px] uppercase tracking-[2px] text-[#3a5a75]">
              Portal Clínico
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(false)
              }}
              placeholder="Código de acesso"
              autoFocus
              className="w-full rounded-lg border border-[#1a3a5c] bg-[#0f2240] px-4 py-3 text-[#cce6f7] placeholder-[#3a5a75] transition-colors focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30"
            />
            {error && (
              <p className="mt-2 text-sm text-[#ff4d6d]">Código inválido</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#00c9b1] py-3 font-bold text-black transition-colors hover:bg-[#00e0c4] disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
