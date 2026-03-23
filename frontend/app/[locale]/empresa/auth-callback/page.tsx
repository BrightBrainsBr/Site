'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { createClient } from '~/utils/supabase/client'

export default function EmpresaAuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Verificando autenticação...')

  useEffect(() => {
    async function handleAuthCallback() {
      const hash = window.location.hash
      if (!hash) {
        setStatus('Link inválido. Redirecionando...')
        setTimeout(
          () => router.replace('/pt-BR/login?error=missing_auth_tokens'),
          1500
        )
        return
      }

      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken || !refreshToken) {
        setStatus('Tokens de autenticação ausentes. Redirecionando...')
        setTimeout(
          () => router.replace('/pt-BR/login?error=missing_auth_tokens'),
          1500
        )
        return
      }

      setStatus('Estabelecendo sessão...')
      const supabase = createClient()

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error('[auth-callback] setSession error:', error.message)
        setStatus('Erro ao estabelecer sessão. Redirecionando...')
        setTimeout(
          () =>
            router.replace(
              `/pt-BR/login?error=session_failed&details=${encodeURIComponent(error.message)}`
            ),
          1500
        )
        return
      }

      setStatus('Sessão estabelecida! Verificando tipo de acesso...')

      try {
        const meRes = await fetch('/api/b2b/me')
        const meData = (await meRes.json()) as {
          isCompanyUser?: boolean
          isCollaborator?: boolean
        }

        if (meData.isCompanyUser) {
          router.replace('/pt-BR/empresa/dashboard')
        } else if (meData.isCollaborator) {
          router.replace('/pt-BR/avaliacao')
        } else {
          router.replace('/pt-BR/empresa/dashboard')
        }
      } catch {
        router.replace('/pt-BR/empresa/dashboard')
      }
    }

    void handleAuthCallback()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07111F]">
      <div className="flex h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
      <p className="mt-4 text-sm text-[#94A3B8]">{status}</p>
    </div>
  )
}
