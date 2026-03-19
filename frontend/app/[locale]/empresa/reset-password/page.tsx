'use client'

import Link from 'next/link'
import { useState } from 'react'

import { createClient } from '~/utils/supabase/client'

export default function EmpresaResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSent(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-8 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00c9b1] to-[#0090ff]">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#cce6f7]">Bright Precision</h2>
              <p className="text-xs text-[#5a7fa0]">Redefinir Senha</p>
            </div>
          </div>

          {sent ? (
            <div className="space-y-3">
              <p className="rounded-lg bg-green-900/30 px-3 py-3 text-sm text-green-300">
                Email enviado! Verifique sua caixa de entrada (e spam) para o link de redefinição de senha.
              </p>
              <Link
                href="/pt-BR/empresa/login"
                className="block text-center text-sm text-[#00c9b1] hover:underline"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#5a7fa0]">
                Insira seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <div>
                <label htmlFor="reset-email" className="mb-1 block text-sm font-medium text-[#cce6f7]">
                  E-mail
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-3 text-[#cce6f7] placeholder-[#5a7fa0] focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30"
                  placeholder="seu@empresa.com"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-[#00c9b1] to-[#0090ff] py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>

              <p className="text-center text-sm text-[#5a7fa0]">
                Lembrou a senha?{' '}
                <Link href="/pt-BR/empresa/login" className="text-[#00c9b1] hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
