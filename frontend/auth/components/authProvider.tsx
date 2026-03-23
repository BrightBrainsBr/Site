// app/auth/components/authProvider.tsx
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { authService } from '@/auth/services_and_hooks/authService'
import { useAuthStore } from '@/auth/services_and_hooks/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const authListenerRef = useRef<
    ReturnType<typeof authService.onAuthStateChange>['data'] | null
  >(null)
  const isInitializedRef = useRef(false)
  const lastEventRef = useRef<string>('')
  const { reset, setSession } = useAuthStore()

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log('[AuthProvider] ⚠️ Already initialized, skipping...')
      return
    }

    console.log('[AuthProvider] 🔧 Setting up auth listener...')
    isInitializedRef.current = true

    const { data: authListener } = authService.onAuthStateChange(
      async (event, newSession) => {
        // Prevent duplicate events
        const eventKey = `${event}-${!!newSession?.user}-${newSession?.user?.id || 'none'}`
        if (lastEventRef.current === eventKey) {
          console.log(`[AuthProvider] 🔕 Duplicate event ignored: ${event}`)
          return
        }
        lastEventRef.current = eventKey

        console.log(`[AuthProvider] 🔔 Auth event: ${event}`, {
          hasUser: !!newSession?.user,
          userId: newSession?.user?.id,
          hasAccessToken: !!newSession?.access_token,
        })

        if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] 👋 User signed out - clearing everything')
          reset()
          queryClient.clear()
        } else if (event === 'SIGNED_IN') {
          console.log(
            '[AuthProvider] 🔑 User signed in - updating session immediately'
          )
          if (newSession) {
            setSession(newSession)
          }
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['auth-session'] })
          }, 50)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthProvider] 🔄 Token refreshed - updating session')
          if (newSession) {
            setSession(newSession)
          }
          queryClient.invalidateQueries({ queryKey: ['auth-session'] })
        } else if (event === 'INITIAL_SESSION') {
          console.log('[AuthProvider] 🚀 Initial session detected')
          if (newSession) {
            setSession(newSession)
          }
          queryClient.invalidateQueries({ queryKey: ['auth-session'] })
        }
      }
    )

    authListenerRef.current = authListener

    return () => {
      console.log('[AuthProvider] 🧹 Cleanup...')
      if (authListenerRef.current) {
        authListenerRef.current.subscription.unsubscribe()
        authListenerRef.current = null
      }
      isInitializedRef.current = false
      lastEventRef.current = ''
    }
  }, [queryClient, reset, setSession])

  return <>{children}</>
}
