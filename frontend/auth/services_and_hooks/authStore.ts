// app/auth/services_and_hooks/authStore.ts
// v5 - Removed newsletter tracking, using registration_completed_at

'use client';

import { type Session, type User } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  type EnrichedOrganization,
  type SubscriptionStatus,
  type UserProfile,
} from '@/app/auth/auth.interface';

interface AuthState {
  // Core auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // User data (cached)
  profile: UserProfile | null;
  organizations: EnrichedOrganization[];
  hasCompletedOnboarding: boolean;
  
  // Subscription state
  subscription: SubscriptionStatus | null;
  isActiveSubscriber: boolean;
  
  // Cache timestamps
  profileLastFetched: number | null;
  organizationsLastFetched: number | null;
  subscriptionLastFetched: number | null;
}

interface AuthStore extends AuthState {
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setOrganizations: (organizations: EnrichedOrganization[]) => void;
  setSubscription: (subscription: SubscriptionStatus | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
  isDataStale: (dataType: 'profile' | 'organizations' | 'subscription', maxAgeMinutes?: number) => boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  
  profile: null,
  organizations: [],
  hasCompletedOnboarding: false,
  subscription: null,
  isActiveSubscriber: false,
  
  profileLastFetched: null,
  organizationsLastFetched: null,
  subscriptionLastFetched: null,
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  ...initialState,
  
  setLoading: (isLoading) => {
    set({ isLoading });
  },
  
  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session?.user,
    });
  },
  
  setProfile: (profile) => set({
    profile,
    hasCompletedOnboarding: !!profile?.registration_completed_at,
    profileLastFetched: Date.now(),
  }),

  setOrganizations: (organizations) => set({ 
    organizations,
    organizationsLastFetched: Date.now(),
  }),

  setSubscription: (subscription) => {
    const activeStatuses = ['active', 'trialing'];
    const isActive = !!subscription?.status && activeStatuses.includes(subscription.status);
    set({ 
      subscription, 
      isActiveSubscriber: isActive,
      subscriptionLastFetched: Date.now(),
    });
  },

  reset: () => {
    set({ ...initialState, isLoading: false });
  },
  
  isDataStale: (dataType, maxAgeMinutes = 60) => {
    const state = get();
    const lastFetched = state[`${dataType}LastFetched` as keyof AuthState] as number | null;
    
    if (!lastFetched) return true;
    
    const maxAge = maxAgeMinutes * 60 * 1000;
    return Date.now() - lastFetched > maxAge;
  },
}));
