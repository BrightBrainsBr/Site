// app/auth/services_and_hooks/useAuthHook.ts
'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { authService } from './authService'
import { useAuthStore } from './authStore'

export function useAuthHook() {
  const authState = useAuthStore()
  const setSession = useAuthStore((state) => state.setSession)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setOrganizations = useAuthStore((state) => state.setOrganizations)
  const setSubscription = useAuthStore((state) => state.setSubscription)
  const setLoading = useAuthStore((state) => state.setLoading)

  const queryClient = useQueryClient()
  const isSessionFetchingRef = useRef(false)

  // 1. COMBINED session + user data query - fetch everything in one go
  const authQuery = useQuery({
    queryKey: ['auth-complete'],
    queryFn: async () => {
      if (isSessionFetchingRef.current) {
        return {
          session: authState.session,
          profile: authState.profile,
          organizations: authState.organizations,
          subscription: authState.subscription,
        }
      }

      isSessionFetchingRef.current = true

      try {
        // console.log('[useAuthHook] Fetching complete auth state...');

        // Step 1: Get session and user
        const [sessionRes, userRes] = await Promise.all([
          authService.getSession(),
          authService.getUser(),
        ])

        let finalSession = sessionRes.data?.session

        if (!finalSession && userRes.data?.user && !userRes.error) {
          finalSession = {
            user: userRes.data.user,
            access_token: 'synthetic',
            refresh_token: 'synthetic',
            expires_at: Date.now() / 1000 + 3600,
            expires_in: 3600,
            token_type: 'bearer',
          } as any
        }

        if (sessionRes.error && userRes.error) {
          setSession(null)
          setLoading(false)
          return {
            session: null,
            profile: null,
            organizations: [],
            subscription: {
              status: 'free' as const,
              priceId: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: null,
            },
          }
        }

        setSession(finalSession)

        // Step 2: If we have a user, fetch all user data in parallel
        if (finalSession?.user?.id) {
          // console.log('[useAuthHook] Fetching user data for:', finalSession.user.id);

          // NOTE: Organizations and subscription endpoints are disabled for Mindless Academy
          // These are from the old HowTheF* project and not used here
          const [profileRes] = await Promise.allSettled([
            authService.getUserProfile(finalSession.user.id),
            // safeJsonFetch('/api/user-organizations'), // Disabled - not used in Mindless Academy
            // safeJsonFetch('/api/user/subscription-status'), // Disabled - not used in Mindless Academy
          ])

          const profile =
            profileRes.status === 'fulfilled' ? profileRes.value.data : null
          const organizations: any[] = [] // Disabled for Mindless Academy
          const subscription = {
            status: 'free' as const,
            priceId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: null,
          } // Disabled for Mindless Academy

          setProfile(profile || null)
          setOrganizations(organizations)
          setSubscription(subscription)

          return { session: finalSession, profile, organizations, subscription }
        }

        return {
          session: finalSession,
          profile: null,
          organizations: [],
          subscription: {
            status: 'free' as const,
            priceId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: null,
          },
        }
      } catch (error) {
        console.error('[useAuthHook] Complete auth fetch error:', error)
        setSession(null)
        setLoading(false)
        return {
          session: null,
          profile: null,
          organizations: [],
          subscription: {
            status: 'free',
            priceId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: null,
          },
        }
      } finally {
        isSessionFetchingRef.current = false
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch often
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
    retryDelay: 1000,
  })

  // Update loading state - only if it actually changed
  useEffect(() => {
    if (authState.isLoading !== authQuery.isLoading) {
      setLoading(authQuery.isLoading)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setLoading is a stable zustand setter
  }, [authQuery.isLoading, authState.isLoading])

  const refreshUserData = useCallback(() => {
    // console.log('[useAuthHook] Manually refreshing all auth data');
    // Invalidate all auth-related queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['auth-complete'] })
    queryClient.invalidateQueries({ queryKey: ['auth'] })
    authQuery.refetch()
  }, [authQuery, queryClient])

  // Compute primary organization from organizations array
  const primaryOrganization = useMemo(() => {
    return (
      authState.organizations?.find((org) => org.is_primary) ||
      authState.organizations?.[0] ||
      null
    )
  }, [authState.organizations])

  // Sign out functionality
  const signOutAsync = useCallback(async () => {
    // console.log('[useAuthHook] Signing out...');
    try {
      // Call the auth service to sign out
      const result = await authService.signOut()

      // Clear all state
      setSession(null)
      setProfile(null)
      setOrganizations([])
      setSubscription({
        status: 'free' as const,
        priceId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: null,
      })
      setLoading(false)

      // Invalidate and remove the auth query to prevent stale data
      queryClient.removeQueries({ queryKey: ['auth-complete'] })

      return result
    } catch (error) {
      console.error('[useAuthHook] Sign out error:', error)
      throw error
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zustand setters are stable references
  }, [queryClient])

  useEffect(() => {
    return () => {
      isSessionFetchingRef.current = false
    }
  }, [])

  return {
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    session: authState.session,
    profile: authState.profile,
    organizations: authState.organizations,
    primaryOrganization,
    subscription: authState.subscription,
    hasActiveSubscription: authState.isActiveSubscriber,
    hasCompletedOnboarding: authState.hasCompletedOnboarding,

    refreshUserData,
    forceSessionRefresh: refreshUserData, // Same thing now
    signOutAsync, // Add the sign out method
    isSessionLoading: authQuery.isLoading,
    isUserDataLoading: authQuery.isLoading,
    sessionError: authQuery.error,
    userDataError: authQuery.error,
  }
}
