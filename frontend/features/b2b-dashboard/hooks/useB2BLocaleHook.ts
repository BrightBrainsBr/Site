// frontend/features/b2b-dashboard/hooks/useB2BLocaleHook.ts

'use client'

import { useParams } from 'next/navigation'
import { useCallback } from 'react'

const DEFAULT_LOCALE = 'pt-BR'

export function useB2BLocaleHook() {
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? DEFAULT_LOCALE

  const localePath = useCallback(
    (path: string) => `/${locale}${path.startsWith('/') ? path : `/${path}`}`,
    [locale]
  )

  return { locale, localePath }
}
