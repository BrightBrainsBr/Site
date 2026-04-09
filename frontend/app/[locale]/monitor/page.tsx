'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useB2BCompanyUser } from '@/auth/services_and_hooks/useB2BCompanyUser'
import { B2BDashboardComponent } from '~/features/b2b-dashboard/components/B2BDashboardComponent'

export default function MonitorDashboardPage() {
  const router = useRouter()
  const { isCompanyUser, isCollaborator, isLoading, isFetching } =
    useB2BCompanyUser()

  const isResolving = isLoading || isFetching

  useEffect(() => {
    if (isResolving) return
    if (!isCompanyUser) {
      if (isCollaborator) {
        router.replace('/pt-BR/monitor/form')
      } else {
        router.replace('/pt-BR/login')
      }
    }
  }, [isCompanyUser, isCollaborator, isResolving, router])

  if (isResolving) {
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
