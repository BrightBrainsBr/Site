'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignUpRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/pt-BR/signup')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-center text-gray-400">Redirecting to signup...</p>
    </div>
  )
}
