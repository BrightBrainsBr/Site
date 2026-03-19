// frontend/app/[locale]/empresa/login/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { B2BLoginComponent } from '~/features/b2b-dashboard/components/B2BLoginComponent'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-6 flex flex-col items-center gap-2">
        {message === 'invite_only' && (
          <p className="rounded-lg bg-amber-900/30 px-4 py-2 text-sm text-amber-300">
            Acesso por convite. Entre em contato com sua empresa.
          </p>
        )}
        {error === 'not_company_user' && (
          <p className="rounded-lg bg-amber-900/30 px-4 py-2 text-sm text-amber-300">
            Esta conta não tem acesso ao dashboard empresarial.
          </p>
        )}
        {message === 'account_created' && (
          <p className="rounded-lg bg-green-900/30 px-4 py-2 text-sm text-green-300">
            Conta criada com sucesso. Faça login.
          </p>
        )}
        {(message === 'password_updated' || message === 'Password updated successfully') && (
          <p className="rounded-lg bg-green-900/30 px-4 py-2 text-sm text-green-300">
            Senha atualizada com sucesso. Faça login.
          </p>
        )}
        {message === 'logout_success' && (
          <p className="rounded-lg bg-blue-900/30 px-4 py-2 text-sm text-blue-300">
            Sessão encerrada com sucesso.
          </p>
        )}
      </div>
      <B2BLoginComponent />
    </div>
  )
}

export default function EmpresaLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c9b1] border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
