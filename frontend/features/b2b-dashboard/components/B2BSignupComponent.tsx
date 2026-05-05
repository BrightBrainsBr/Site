// frontend/features/b2b-dashboard/components/B2BSignupComponent.tsx

'use client'

import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { authService } from '@/auth/services_and_hooks/authService'
import { BBAuthLayoutComponent } from '~/shared/components/ui/BBAuthLayoutComponent'
import { BBButtonComponent } from '~/shared/components/ui/BBButtonComponent'
import { BBInputComponent } from '~/shared/components/ui/BBInputComponent'

import { useB2BLocaleHook } from '../hooks/useB2BLocaleHook'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
}

type EmailStatus =
  | 'idle'
  | 'checking'
  | 'matched_domain'
  | 'matched_invite'
  | 'no_match'

export function B2BSignupComponent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { localePath } = useB2BLocaleHook()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const lastCheckedEmail = useRef('')

  const { control, handleSubmit, watch } = useForm<SignupFormData>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
    mode: 'onBlur',
  })

  const passwordValue = watch('password')

  const checkEmail = useCallback(async (emailValue: string) => {
    if (!emailValue || typeof emailValue !== 'string') return
    const trimmed = emailValue.trim().toLowerCase()
    const parts = trimmed.split('@')
    if (parts.length < 2 || !parts[1].includes('.')) return
    if (trimmed === lastCheckedEmail.current) return
    lastCheckedEmail.current = trimmed

    setEmailStatus('checking')
    setError(null)
    try {
      const res = await fetch('/api/brightmonitor/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, checkDomain: true }),
      })
      const data = await res.json()
      if (data.matched) {
        setEmailStatus(
          data.matchType === 'invite' ? 'matched_invite' : 'matched_domain'
        )
      } else {
        setEmailStatus('no_match')
      }
    } catch {
      setEmailStatus('idle')
    }
  }, [])

  const onSubmit = async (data: SignupFormData) => {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/brightmonitor/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const resData = await res.json()

      if (!res.ok) {
        setError(resData.error || 'Erro ao criar conta')
        return
      }

      setSuccess(true)

      const signInResult = await authService.signIn({
        email: data.email,
        password: data.password,
      })

      if (signInResult.error) {
        router.push(localePath('/login?message=account_created'))
        return
      }

      await queryClient.resetQueries({ queryKey: ['b2b'] })

      const meRes = await fetch('/api/brightmonitor/me')
      const meData = await meRes.json()

      if (meData.isCompanyUser) {
        router.push(localePath('/monitor'))
      } else {
        router.push(localePath('/monitor/form'))
      }
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const emailHint = (() => {
    switch (emailStatus) {
      case 'checking':
        return { text: 'Verificando...', color: 'text-[#5a7fa0]' }
      case 'matched_domain':
        return {
          text: 'Domínio reconhecido. Crie sua conta para acessar a avaliação como colaborador.',
          color: 'text-[#34D399]',
        }
      case 'matched_invite':
        return {
          text: 'Convite encontrado. Crie sua senha para acessar a avaliação.',
          color: 'text-[#34D399]',
        }
      case 'no_match':
        return {
          text: 'Você ainda não foi convidado. Solicite um convite à sua empresa para acessar a plataforma.',
          color: 'text-[#F59E0B]',
        }
      default:
        return {
          text: 'Use o e-mail corporativo ou o e-mail no qual recebeu um convite.',
          color: 'text-[#5a7fa0]',
        }
    }
  })()

  return (
    <BBAuthLayoutComponent
      heading="Bright Brains"
      subheading="Crie sua conta para acessar a plataforma Bright Brains."
      cardTitle="Criar conta"
      footer={
        <p className="text-sm text-[#5a7fa0]">
          Já tem conta?{' '}
          <Link
            href={localePath('/login')}
            className="font-medium text-[#00c9b1] hover:text-[#00c9b1]/80 transition-colors"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <BBInputComponent
            control={control}
            name="email"
            label="E-mail"
            type="email"
            placeholder="seu@empresa.com"
            autoComplete="email"
            rules={{
              required: 'E-mail é obrigatório',
              pattern: {
                value: /.+@.+\..+/,
                message: 'Insira um e-mail válido',
              },
            }}
            onBlurCallback={(e) => void checkEmail(e.target.value)}
          />
          <p className={`mt-1.5 text-xs ${emailHint.color}`}>
            {emailHint.text}
          </p>
        </div>

        <BBInputComponent
          control={control}
          name="password"
          label="Criar senha"
          type="password"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          rules={{
            required: 'Senha é obrigatória',
            minLength: {
              value: 6,
              message: 'A senha deve ter no mínimo 6 caracteres',
            },
          }}
        />

        <BBInputComponent
          control={control}
          name="confirmPassword"
          label="Confirmar senha"
          type="password"
          placeholder="Repita a senha"
          autoComplete="new-password"
          rules={{
            required: 'Confirmação de senha é obrigatória',
            validate: (value: string) =>
              value === passwordValue || 'As senhas não coincidem',
          }}
        />

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-700/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-900/20 border border-green-700/40 px-4 py-3 text-sm text-green-300">
            Conta criada com sucesso! Entrando no dashboard...
          </div>
        )}

        <BBButtonComponent
          type="submit"
          loading={loading}
          loadingText="Criando conta..."
          disabled={
            success || emailStatus === 'no_match' || emailStatus === 'checking'
          }
          className="!py-3.5 text-base"
        >
          Criar conta
        </BBButtonComponent>
      </form>
    </BBAuthLayoutComponent>
  )
}
