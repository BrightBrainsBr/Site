'use client'

import { ArrowLeft, Check, KeyRound, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { createClient } from '~/utils/supabase/client'

export default function EmpresaProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [nameLoading, setNameLoading] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? null)
        setDisplayName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '')
      }
      setLoading(false)
    }
    void load()
  }, [])

  const handleNameSave = async () => {
    setNameLoading(true)
    setNameMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      })
      if (error) {
        setNameMsg({ ok: false, text: error.message })
      } else {
        setNameMsg({ ok: true, text: 'Nome atualizado com sucesso.' })
      }
    } catch {
      setNameMsg({ ok: false, text: 'Erro de conexão.' })
    } finally {
      setNameLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)

    if (newPassword.length < 6) {
      setPwMsg({ ok: false, text: 'A senha deve ter no mínimo 6 caracteres.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ ok: false, text: 'As senhas não coincidem.' })
      return
    }

    setPwLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPwMsg({ ok: false, text: error.message })
      } else {
        setPwMsg({ ok: true, text: 'Senha atualizada com sucesso.' })
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPwMsg({ ok: false, text: 'Erro de conexão.' })
    } finally {
      setPwLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111F]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07111F]">
      <div className="border-b border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/pt-BR/empresa/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          >
            <ArrowLeft className="h-4 w-4 text-[#94A3B8]" />
          </Link>
          <h1 className="text-[16px] font-semibold text-[#E2E8F0]">Meu Perfil</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {/* Email (read-only) */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#14B8A6]" />
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">E-mail</h3>
          </div>
          <p className="text-[13px] text-[#94A3B8]">{email ?? '—'}</p>
          <p className="mt-1 text-[11px] text-[#64748B]">
            O e-mail não pode ser alterado.
          </p>
        </div>

        {/* Display name */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-[#14B8A6]" />
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">Nome</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-72 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[13px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
            />
            <button
              onClick={handleNameSave}
              disabled={nameLoading}
              className="rounded-lg bg-[#0D9488] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              {nameLoading ? '...' : 'Salvar'}
            </button>
          </div>
          {nameMsg && (
            <p className={`mt-2 text-[12px] ${nameMsg.ok ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
              {nameMsg.text}
            </p>
          )}
        </div>

        {/* Password change */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#14B8A6]" />
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">Alterar Senha</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] text-[#64748B]">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-72 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[13px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[#64748B]">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
                placeholder="Repita a senha"
                className="w-72 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[13px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
              />
            </div>
            {pwMsg && (
              <p className={`text-[12px] ${pwMsg.ok ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                {pwMsg.ok && <Check className="mr-1 inline h-3 w-3" />}
                {pwMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="rounded-lg bg-[#0D9488] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              {pwLoading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
