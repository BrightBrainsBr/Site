// app/auth/utils/authDiagnostics.tsx
// app/utils/authDiagnostics.ts
'use client'

import { authService } from '@/auth/services_and_hooks/authService'
import { useAuthStore } from '@/auth/services_and_hooks/authStore'
import { createClient } from '@/utils/supabase/client'

/**
 * Diagnostic utility for auth issues
 * Run in the console with window.diagnoseAuth()
 */
export async function diagnoseAuthIssue() {
  console.warn('🔍 Auth State Diagnosis')

  try {
    // Check Supabase Session directly
    const supabase = createClient()
    console.warn('Checking direct Supabase session...')
    const { data: sessionData } = await supabase.auth.getSession()
    console.warn('Supabase Session:', sessionData.session ? 'Exists' : 'None')
    if (sessionData.session) {
      console.warn(
        '  Session expires:',
        new Date(sessionData.session.expires_at! * 1000).toLocaleString()
      )
      console.warn('  User ID in session:', sessionData.session.user?.id)
    }

    // Check Supabase User directly
    console.warn('Checking direct Supabase user...')
    const { data: userData } = await supabase.auth.getUser()
    console.warn('Supabase User:', userData.user ? 'Exists' : 'None')
    if (userData.user) {
      console.warn('  User ID:', userData.user.id)
      console.warn('  User email:', userData.user.email)
    }

    // Check via auth service
    console.warn('Checking via auth service...')
    const serviceSession = await authService.getSession()
    console.warn(
      'Auth Service Session:',
      serviceSession.data ? 'Exists' : 'None'
    )

    const serviceUser = await authService.getUser()
    console.warn('Auth Service User:', serviceUser.data ? 'Exists' : 'None')

    // Check Auth Store
    console.warn('Checking Zustand store state...')
    const authStore = useAuthStore.getState()
    console.warn('  isLoading:', authStore.isLoading)
    console.warn('  isAuthenticated:', authStore.isAuthenticated)
    console.warn('  User exists:', !!authStore.user)
    console.warn('  Session exists:', !!authStore.session)

    // Check for mismatches
    if (!!sessionData.session !== !!authStore.session) {
      console.warn(
        '⚠️ MISMATCH: Session existence different between Supabase and Auth Store'
      )
    }

    if (!!userData.user !== !!authStore.user) {
      console.warn(
        '⚠️ MISMATCH: User existence different between Supabase and Auth Store'
      )
    }

    if (
      userData.user &&
      authStore.user &&
      userData.user.id !== authStore.user.id
    ) {
      console.warn(
        '⚠️ MISMATCH: User IDs different between Supabase and Auth Store'
      )
    }

    // Check localStorage
    const authStoreData = localStorage.getItem('auth-store')
    console.warn(
      'Auth Store in localStorage:',
      authStoreData ? 'Exists' : 'None'
    )
    if (authStoreData) {
      try {
        const parsedData = JSON.parse(authStoreData)
        console.warn('  State from localStorage:', parsedData.state)

        // Check for localStorage vs memory mismatches
        if (!!parsedData.state.user !== !!authStore.user) {
          console.warn(
            '⚠️ MISMATCH: User existence different between localStorage and Auth Store memory'
          )
        }
        if (!!parsedData.state.session !== !!authStore.session) {
          console.warn(
            '⚠️ MISMATCH: Session existence different between localStorage and Auth Store memory'
          )
        }
      } catch (e) {
        console.error('  Error parsing localStorage data:', e)
      }
    }

    // Offer to fix state if mismatches detected
    const hasMismatch =
      !!sessionData.session !== !!authStore.session ||
      !!userData.user !== !!authStore.user

    if (hasMismatch && sessionData.session && userData.user) {
      console.warn('🔧 Found mismatch with valid session - attempting to fix...')
      useAuthStore.setState({
        user: userData.user,
        session: sessionData.session,
        isAuthenticated: true,
        isLoading: false,
      })
      console.warn('✅ Auth store state updated')
    }
  } catch (error) {
    console.error('Error during auth diagnosis:', error)
  }

  return 'Auth diagnosis complete. Check console for details.'
}

// Add global accessor
if (typeof window !== 'undefined') {
  ;(window as any).diagnoseAuth = diagnoseAuthIssue
  ;(window as any).fixAuthState = async () => {
    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const { data: userData } = await supabase.auth.getUser()

      if (sessionData.session && userData.user) {
        useAuthStore.setState({
          user: userData.user,
          session: sessionData.session,
          isAuthenticated: true,
          isLoading: false,
        })
        return 'Auth state fixed successfully'
      } else {
        return 'Cannot fix auth state - no valid session or user'
      }
    } catch (error) {
      console.error('Error fixing auth state:', error)
      return 'Failed to fix auth state'
    }
  }
}
