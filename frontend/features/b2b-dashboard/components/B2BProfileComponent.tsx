// frontend/features/b2b-dashboard/components/B2BProfileComponent.tsx

'use client'

import { ArrowLeft, Check, KeyRound, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { BBButtonComponent } from '~/shared/components/ui/BBButtonComponent'
import { BBInputComponent } from '~/shared/components/ui/BBInputComponent'

import { useB2BLocaleHook } from '../hooks/useB2BLocaleHook'
import { useB2BProfileMutationHook } from '../hooks/useB2BProfileMutationHook'
import { useB2BProfileQueryHook } from '../hooks/useB2BProfileQueryHook'

interface NameFormData {
  display_name: string
}

interface PasswordFormData {
  newPassword: string
  confirmPassword: string
}

export function B2BProfileComponent() {
  const { localePath } = useB2BLocaleHook()
  const { data: profile, isLoading } = useB2BProfileQueryHook()
  const mutation = useB2BProfileMutationHook()

  const [nameMsg, setNameMsg] = useState<{
    ok: boolean
    text: string
  } | null>(null)
  const [pwMsg, setPwMsg] = useState<{
    ok: boolean
    text: string
  } | null>(null)

  const nameForm = useForm<NameFormData>({
    defaultValues: { display_name: '' },
    mode: 'onBlur',
  })

  const pwForm = useForm<PasswordFormData>({
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onBlur',
  })

  const newPasswordValue = pwForm.watch('newPassword')

  useEffect(() => {
    if (profile?.display_name) {
      nameForm.reset({ display_name: profile.display_name })
    }
  }, [profile?.display_name, nameForm])

  const handleNameSave = async (data: NameFormData) => {
    setNameMsg(null)
    try {
      await mutation.mutateAsync({ display_name: data.display_name })
      setNameMsg({ ok: true, text: 'Nome atualizado com sucesso.' })
    } catch (err) {
      setNameMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Erro de conexão.',
      })
    }
  }

  const handlePasswordChange = async (data: PasswordFormData) => {
    setPwMsg(null)
    try {
      await mutation.mutateAsync({ password: data.newPassword })
      setPwMsg({ ok: true, text: 'Senha atualizada com sucesso.' })
      pwForm.reset()
    } catch (err) {
      setPwMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Erro de conexão.',
      })
    }
  }

  if (isLoading) {
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
            href={localePath('/empresa/dashboard')}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          >
            <ArrowLeft className="h-4 w-4 text-[#94A3B8]" />
          </Link>
          <h1 className="text-[16px] font-semibold text-[#E2E8F0]">
            Meu Perfil
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {/* Email (read-only) */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#14B8A6]" />
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              E-mail
            </h3>
          </div>
          <p className="text-[13px] text-[#94A3B8]">
            {profile?.email ?? '—'}
          </p>
          <p className="mt-1 text-[11px] text-[#64748B]">
            O e-mail não pode ser alterado.
          </p>
        </div>

        {/* Display name */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-[#14B8A6]" />
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Nome
            </h3>
          </div>
          <form
            onSubmit={nameForm.handleSubmit(handleNameSave)}
            className="flex items-start gap-2"
          >
            <BBInputComponent
              control={nameForm.control}
              name="display_name"
              placeholder="Seu nome completo"
              inputClassName="w-72 !py-2 text-[13px]"
              rules={{ required: 'Nome é obrigatório' }}
            />
            <BBButtonComponent
              type="submit"
              variant="secondary"
              loading={mutation.isPending}
              className="!w-auto !py-2 px-4 text-[12px]"
            >
              Salvar
            </BBButtonComponent>
          </form>
          {nameMsg && (
            <p
              className={`mt-2 text-[12px] ${nameMsg.ok ? 'text-[#34D399]' : 'text-[#F87171]'}`}
            >
              {nameMsg.text}
            </p>
          )}
        </div>

        {/* Password change */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#14B8A6]" />
            <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
              Alterar Senha
            </h3>
          </div>
          <form
            onSubmit={pwForm.handleSubmit(handlePasswordChange)}
            className="space-y-3"
          >
            <BBInputComponent
              control={pwForm.control}
              name="newPassword"
              label="Nova senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              inputClassName="w-72 !py-2 text-[13px]"
              rules={{
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'A senha deve ter no mínimo 6 caracteres',
                },
              }}
            />
            <BBInputComponent
              control={pwForm.control}
              name="confirmPassword"
              label="Confirmar nova senha"
              type="password"
              placeholder="Repita a senha"
              autoComplete="new-password"
              inputClassName="w-72 !py-2 text-[13px]"
              rules={{
                required: 'Confirmação é obrigatória',
                validate: (value: string) =>
                  value === newPasswordValue || 'As senhas não coincidem',
              }}
            />
            {pwMsg && (
              <p
                className={`text-[12px] ${pwMsg.ok ? 'text-[#34D399]' : 'text-[#F87171]'}`}
              >
                {pwMsg.ok && <Check className="mr-1 inline h-3 w-3" />}
                {pwMsg.text}
              </p>
            )}
            <BBButtonComponent
              type="submit"
              variant="secondary"
              loading={mutation.isPending}
              className="!w-auto px-4 !py-2 text-[12px]"
            >
              Atualizar senha
            </BBButtonComponent>
          </form>
        </div>
      </div>
    </div>
  )
}
