// frontend/app/[locale]/empresa/login/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { B2BLoginComponent } from '~/features/b2b-dashboard/components/B2BLoginComponent'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const alertMessage =
    error === 'not_company_user'
      ? 'Esta conta não tem acesso ao dashboard empresarial.'
      : message === 'invite_only'
        ? 'Acesso por convite. Entre em contato com sua empresa.'
        : message === 'account_created'
          ? 'Conta criada com sucesso. Faça login.'
          : message === 'password_updated' ||
              message === 'Password updated successfully'
            ? 'Senha atualizada com sucesso. Faça login.'
            : message === 'logout_success'
              ? 'Sessão encerrada com sucesso.'
              : null

  const alertType =
    error === 'not_company_user' || message === 'invite_only'
      ? 'warning'
      : message === 'logout_success'
        ? 'info'
        : 'success'

  const alertStyles = {
    warning: 'bg-amber-900/20 border-amber-700/40 text-amber-300',
    success: 'bg-green-900/20 border-green-700/40 text-green-300',
    info: 'bg-blue-900/20 border-blue-700/40 text-blue-300',
  }

  return (
    <>
      {alertMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${alertStyles[alertType]}`}
          >
            {alertMessage}
          </div>
        </div>
      )}
      <B2BLoginComponent />
    </>
  )
}

export default function EmpresaLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#060e1a]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c9b1] border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
