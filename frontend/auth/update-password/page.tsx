// frontend/auth/update-password/page.tsx

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { authService } from '@/auth/services_and_hooks/authService'
import { BBAuthLayoutComponent } from '~/shared/components/ui/BBAuthLayoutComponent'
import { BBButtonComponent } from '~/shared/components/ui/BBButtonComponent'
import { BBInputComponent } from '~/shared/components/ui/BBInputComponent'

const LOGIN_PATH = '/pt-BR/empresa/login'

interface UpdatePasswordFormData {
  password: string
  confirmPassword: string
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, watch } = useForm<UpdatePasswordFormData>({
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onBlur',
  })

  const passwordValue = watch('password')

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setError(null)
    setLoading(true)

    try {
      const result = await authService.updatePassword({
        password: data.password,
      })
      if (result.error) {
        setError(result.error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push(`${LOGIN_PATH}?message=password_updated`)
        }, 2000)
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao atualizar senha'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <BBAuthLayoutComponent
        heading="Bright Brains"
        subheading="Nova senha"
        cardTitle="Senha atualizada"
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
          <p className="text-sm text-green-300">
            Senha atualizada com sucesso! Redirecionando para o login...
          </p>
        </div>
      </BBAuthLayoutComponent>
    )
  }

  return (
    <BBAuthLayoutComponent
      heading="Bright Brains"
      subheading="Nova senha"
      cardTitle="Atualizar senha"
      footer={
        <p className="text-sm text-[#5a7fa0]">
          <Link
            href={LOGIN_PATH}
            className="font-medium text-[#00c9b1] hover:text-[#00c9b1]/80 transition-colors"
          >
            Voltar ao login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-[#5a7fa0]">
          Escolha uma nova senha para sua conta.
        </p>

        <BBInputComponent
          control={control}
          name="password"
          label="Nova senha"
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
          label="Confirmar nova senha"
          type="password"
          placeholder="Repita a senha"
          autoComplete="new-password"
          rules={{
            required: 'Confirmação é obrigatória',
            validate: (value: string) =>
              value === passwordValue || 'As senhas não coincidem',
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
          loadingText="Atualizando..."
          className="!py-3.5 text-base"
        >
          Atualizar senha
        </BBButtonComponent>
      </form>
    </BBAuthLayoutComponent>
  )
}
