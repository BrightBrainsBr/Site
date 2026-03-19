'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { authService } from '@/auth/services_and_hooks/authService'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await authService.updatePassword({ password })
      if (result.error) {
        setError(result.error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/pt-BR/empresa/login?message=password_updated')
        }, 2000)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar senha'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07111F] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-4 rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-8 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00c9b1] to-[#0090ff]">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#cce6f7]">Bright Precision</h2>
              <p className="text-xs text-[#5a7fa0]">Nova Senha</p>
            </div>
          </div>

          {success ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-center text-sm text-green-300">
                Senha atualizada com sucesso! Redirecionando...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-[#5a7fa0]">
                Escolha uma nova senha para sua conta.
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#cce6f7]">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-3 text-[#cce6f7] placeholder-[#5a7fa0] focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#cce6f7]">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-3 text-[#cce6f7] placeholder-[#5a7fa0] focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-[#00c9b1] to-[#0090ff] py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
              </button>

              <p className="text-center text-sm text-[#5a7fa0]">
                <Link href="/pt-BR/empresa/login" className="text-[#00c9b1] hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
