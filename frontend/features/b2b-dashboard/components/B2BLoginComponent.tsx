// frontend/features/b2b-dashboard/components/B2BLoginComponent.tsx

'use client'

import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { authService } from '@/auth/services_and_hooks/authService'
import { BBAuthLayoutComponent } from '~/shared/components/ui/BBAuthLayoutComponent'
import { BBButtonComponent } from '~/shared/components/ui/BBButtonComponent'
import { BBInputComponent } from '~/shared/components/ui/BBInputComponent'

import { useB2BLocaleHook } from '../hooks/useB2BLocaleHook'

interface LoginFormData {
  email: string
  password: string
}

export function B2BLoginComponent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { localePath } = useB2BLocaleHook()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setLoading(true)

    try {
      const result = await authService.signIn({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        setError(result.error.message)
        return
      }

      await queryClient.resetQueries({ queryKey: ['b2b'] })

      const meRes = await fetch('/api/b2b/me')
      const meData = await meRes.json()

      if (meData.isCompanyUser) {
        router.push(localePath('/empresa/dashboard'))
      } else {
        router.push(localePath('/avaliacao'))
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BBAuthLayoutComponent
      heading="Bright Brains"
      subheading="Bem-vindo de volta"
      cardTitle="Login"
      footer={
        <p className="text-sm text-[#5a7fa0]">
          Não tem conta?{' '}
          <Link
            href={localePath('/empresa/signup')}
            className="font-medium text-[#00c9b1] hover:text-[#00c9b1]/80 transition-colors"
          >
            Criar conta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <BBInputComponent
          control={control}
          name="password"
          label="Senha"
          type="password"
          placeholder="Sua senha"
          autoComplete="current-password"
          rules={{ required: 'Senha é obrigatória' }}
        />

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-700/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <BBButtonComponent
          type="submit"
          loading={loading}
          loadingText="Entrando..."
          className="!py-3.5 text-base"
        >
          Entrar
        </BBButtonComponent>

        <div className="text-center">
          <Link
            href={localePath('/empresa/reset-password')}
            className="text-sm text-[#5a7fa0] hover:text-[#00c9b1] transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </form>
    </BBAuthLayoutComponent>
  )
}
