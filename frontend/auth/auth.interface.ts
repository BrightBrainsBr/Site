// app/auth/auth.interface.ts
import { Session, User } from '@supabase/supabase-js';

import { Database } from '@/types/supabase';

// User types in the system (Bright Precision B2B)
export type UserType = 'company_hr';

// Use database types directly from Supabase (will auto-update after migration)
type Tables = Database['public']['Tables'];

// UserProfile from database - matches the new user_profiles schema
// Fields: id, user_id, email, user_type, first_name, last_name, 
//         registration_completed_at, last_login_at, created_at, updated_at
export type UserProfile = Tables['user_profiles']['Row'];

// Organization type - legacy from HowTheF*, not used in Mindless Academy
// Organizations array is always empty but type is kept for interface compatibility
export type Organization = {
  id: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
};

// Create enriched organization type with user role info
export type EnrichedOrganization = Organization & {
  role?: string | null;
  is_primary?: boolean | null;
};

export interface SubscriptionStatus {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none' | 'free' | null;
  priceId: string | null;
  product_id?: string | null;
  unit_amount?: number | null;
  currency?: string | null;
  interval?: string | null;
  interval_count?: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
}

/**
 * Auth state stored in Zustand
 */
export interface AuthState {
  /** The authenticated user from Supabase */
  user: User | null;
  
  /** The current session from Supabase */
  session: Session | null;
  
  /** The user's profile from our database */
  profile: UserProfile | null;
  
  /** The user's organizations with role information */
  organizations: EnrichedOrganization[];
  
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  
  /** Whether the auth state is still loading */
  isLoading: boolean;
  
  /** Whether the user has completed onboarding (registration_completed_at is set) */
  hasCompletedOnboarding: boolean;

  /** true once the first auth check finished */
  isAuthReady: boolean;

  subscription: SubscriptionStatus | null;

  isActiveSubscriber: boolean;
}

/**
 * Credentials for login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface SignupCredentials {
  email: string;
  password: string;
}

/**
 * Password reset credentials
 */
export interface ResetPasswordCredentials {
  email: string;
}

/**
 * Update password credentials
 */
export interface UpdatePasswordCredentials {
  password: string;
}

/**
 * Auth error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  WEAK_PASSWORD = 'weak_password',
  USER_NOT_FOUND = 'user_not_found',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
  NOT_FOUND = 'not_found',
  DATABASE_ERROR = 'database_error',
  TOO_MANY_ATTEMPTS = 'too_many_attempts',
  EXPIRED_CODE = 'expired_code',
  INVALID_CODE = 'invalid_code',
}

/**
 * Auth service response
 */
export interface AuthResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: AuthErrorCode;
  };
}

/**
 * User profile response
 */
export interface ProfileResponse {
  profile: UserProfile;
}
