// frontend/features/b2b-dashboard/components/B2BResetPasswordComponent.tsx

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { authService } from '@/auth/services_and_hooks/authService'
import { BBAuthLayoutComponent } from '~/shared/components/ui/BBAuthLayoutComponent'
import { BBButtonComponent } from '~/shared/components/ui/BBButtonComponent'
import { BBInputComponent } from '~/shared/components/ui/BBInputComponent'

import { useB2BLocaleHook } from '../hooks/useB2BLocaleHook'

interface ResetPasswordFormData {
  email: string
}

export function B2BResetPasswordComponent() {
  const { localePath } = useB2BLocaleHook()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit } = useForm<ResetPasswordFormData>({
    defaultValues: { email: '' },
    mode: 'onBlur',
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null)
    setLoading(true)

    try {
      const result = await authService.resetPassword({ email: data.email })

      if (result.error) {
        // For security, always show success (don't reveal if email exists)
      }

      setSent(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <BBAuthLayoutComponent
        heading="Bright Brains"
        subheading="Redefinição de senha"
        cardTitle="Verifique seu e-mail"
      >
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
            <svg
              className="h-8 w-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <p className="mb-6 text-[#5a7fa0]">
            Enviamos as instruções de redefinição de senha para o seu e-mail.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-[#5a7fa0]">
              Não recebeu o e-mail? Verifique a pasta de spam ou{' '}
              <button
                onClick={() => {
                  setSent(false)
                  setError(null)
                }}
                className="font-medium text-[#00c9b1] hover:text-[#00c9b1]/80 transition-colors"
              >
                tente novamente
              </button>
            </p>
            <p className="text-sm text-[#5a7fa0]">
              Lembrou a senha?{' '}
              <Link
                href={localePath('/empresa/login')}
                className="font-medium text-[#00c9b1] hover:text-[#00c9b1]/80 transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </BBAuthLayoutComponent>
    )
  }

  return (
    <BBAuthLayoutComponent
      heading="Bright Brains"
      subheading="Esqueceu sua senha?"
      cardTitle="Redefinir senha"
      footer={
        <div className="space-y-2">
          <p className="text-sm text-[#5a7fa0]">
            Lembrou a senha?{' '}
            <Link
              href={localePath('/empresa/login')}
              className="font-medium text-[#00c9b1] hover:text-[#00c9b1]/80 transition-colors"
            >
              Entrar
            </Link>
          </p>
          <p className="text-sm text-[#5a7fa0]">
            Não tem conta?{' '}
            <Link
              href={localePath('/empresa/signup')}
              className="font-medium text-[#00c9b1] hover:text-[#00c9b1]/80 transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-[#5a7fa0]">
          Insira seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

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
        />

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-700/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <BBButtonComponent
          type="submit"
          loading={loading}
          loadingText="Enviando..."
          className="!py-3.5 text-base"
        >
          Enviar link de redefinição
        </BBButtonComponent>
      </form>
    </BBAuthLayoutComponent>
  )
}
