// frontend/app/[locale]/empresa/dashboard/page.tsx

'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useB2BCompanyUser } from '@/auth/services_and_hooks/useB2BCompanyUser'
import { B2BDashboardComponent } from '~/features/b2b-dashboard/components/B2BDashboardComponent'

export default function EmpresaDashboardPage() {
  const router = useRouter()
  const { isCompanyUser, isLoading } = useB2BCompanyUser()

  useEffect(() => {
    if (isLoading) return
    if (!isCompanyUser) {
      router.replace('/pt-BR/empresa/login?error=not_company_user')
    }
  }, [isCompanyUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c9b1] border-t-transparent" />
      </div>
    )
  }

  if (!isCompanyUser) {
    return null
  }

  return <B2BDashboardComponent />
}
