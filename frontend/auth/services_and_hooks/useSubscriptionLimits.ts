// app/auth/services_and_hooks/useSubscriptionLimits.ts
'use client'

import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from './authStore'

interface SubscriptionLimits {
  maxPersonalizedUseCases: number
  currentPersonalizedUseCases: number
  hasReachedLimit: boolean
  canCreateMore: boolean
  remainingUseCases: number
}

// Define limits based on subscription tier
const SUBSCRIPTION_LIMITS = {
  free: { maxPersonalizedUseCases: 3 },
  active: { maxPersonalizedUseCases: -1 }, // -1 means unlimited
  trialing: { maxPersonalizedUseCases: -1 }, // -1 means unlimited
} as const

export function useSubscriptionLimits() {
  const { user, subscription, isActiveSubscriber } = useAuthStore()

  // Fetch current usage
  const {
    data: limits,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subscription-limits', user?.id],
    queryFn: async (): Promise<SubscriptionLimits> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Get current usage from API
      const response = await fetch('/api/user/usage-stats')
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats')
      }

      const usageData = await response.json()
      const currentUsage = usageData.personalizedUseCasesCount || 0

      // Determine limits based on subscription
      const subscriptionType = isActiveSubscriber ? 'active' : 'free'
      const maxLimit =
        SUBSCRIPTION_LIMITS[subscriptionType].maxPersonalizedUseCases

      const isUnlimited = maxLimit === -1
      const hasReachedLimit = !isUnlimited && currentUsage >= maxLimit
      const canCreateMore = isUnlimited || !hasReachedLimit
      const remainingUseCases = isUnlimited
        ? -1
        : Math.max(0, maxLimit - currentUsage)

      return {
        maxPersonalizedUseCases: maxLimit,
        currentPersonalizedUseCases: currentUsage,
        hasReachedLimit,
        canCreateMore,
        remainingUseCases,
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const checkCanCreate = () => {
    if (isLoading) return { canCreate: false, reason: 'Loading...' }
    if (error) return { canCreate: false, reason: 'Error checking limits' }
    if (!limits)
      return { canCreate: false, reason: 'Unable to determine limits' }

    if (!limits.canCreateMore) {
      return {
        canCreate: false,
        reason: `You've reached your limit of ${limits.maxPersonalizedUseCases} AI workflows. Upgrade to create unlimited workflows.`,
      }
    }

    return { canCreate: true, reason: null }
  }

  const refreshLimits = () => {
    refetch()
  }

  return {
    limits,
    isLoading,
    error,
    checkCanCreate,
    refreshLimits,
    // Convenience properties
    canCreateMore: limits?.canCreateMore ?? false,
    isUnlimited: limits?.maxPersonalizedUseCases === -1,
    usagePercentage:
      limits?.maxPersonalizedUseCases === -1
        ? 0
        : ((limits?.currentPersonalizedUseCases || 0) /
            (limits?.maxPersonalizedUseCases || 1)) *
          100,
  }
}
