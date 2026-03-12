// frontend/shared/providers/ReactQueryProvider.tsx
'use client'

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'

function isJsonParseError(error: unknown): boolean {
  return error instanceof Error && error.message?.includes('not valid JSON')
}

export function ReactQueryProvider({ children }: React.PropsWithChildren) {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isJsonParseError(event.reason)) {
        event.preventDefault()
      }
    }

    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('not valid JSON')) {
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (isJsonParseError(error)) return
            console.error('[ReactQuery] Query error:', error)
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (isJsonParseError(error)) return
            console.error('[ReactQuery] Mutation error:', error)
          },
        }),
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              if (isJsonParseError(error)) return false
              return failureCount < 1
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
