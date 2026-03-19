'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '~/utils/supabase/client'

export function B2BSignupComponent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/b2b/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(code ? { code } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.needsCode && !showCode) {
          setShowCode(true)
          setError('Email não vinculado a nenhuma empresa. Insira um código de acesso abaixo.')
          return
        }
        setError(data.error || 'Erro ao criar conta')
        return
      }

      setSuccess(true)

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        router.push('/pt-BR/empresa/login?message=account_created')
        return
      }

      router.push('/pt-BR/empresa/dashboard')
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-8 shadow-xl"
      >
        <div className="flex items-center gap-3">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#cce6f7]">Bright Precision</h2>
            <p className="text-xs text-[#5a7fa0]">Criar Conta</p>
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-[#cce6f7]">
            E-mail corporativo
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-3 text-[#cce6f7] placeholder-[#5a7fa0] focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30"
            placeholder="seu@empresa.com"
          />
          <p className="mt-1 text-[11px] text-[#5a7fa0]">
            Use o e-mail do domínio da sua empresa para acesso automático.
          </p>
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-[#cce6f7]">
            Senha
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-3 text-[#cce6f7] placeholder-[#5a7fa0] focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {showCode && (
          <div>
            <label htmlFor="signup-code" className="mb-1 block text-sm font-medium text-[#cce6f7]">
              Código de acesso
            </label>
            <input
              id="signup-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-3 text-[#cce6f7] placeholder-[#5a7fa0] focus:border-[#00c9b1] focus:outline-none focus:ring-1 focus:ring-[#00c9b1]/30"
              placeholder="Código fornecido pela empresa"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        {success && (
          <p className="rounded-lg bg-green-900/30 px-3 py-2 text-sm text-green-300">
            Conta criada com sucesso! Entrando no dashboard...
          </p>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="w-full rounded-lg bg-gradient-to-r from-[#00c9b1] to-[#0090ff] py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p className="text-center text-sm text-[#5a7fa0]">
          Já tem conta?{' '}
          <Link href="/pt-BR/empresa/login" className="text-[#00c9b1] hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}
