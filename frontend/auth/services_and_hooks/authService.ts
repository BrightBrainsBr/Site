// app/auth/services_and_hooks/authService.ts
'use client'

import { type AuthChangeEvent, type Session } from '@supabase/supabase-js'

import type { SignupCredentials } from '@/auth/auth.interface'
import {
  AuthErrorCode,
  type AuthResponse,
  type LoginCredentials,
  type ResetPasswordCredentials,
  type UpdatePasswordCredentials,
  type UserProfile,
} from '@/auth/auth.interface'
import { type Database } from '@/types/supabase'
import { createClient } from '~/utils/supabase/client'

import { useAuthStore } from './authStore'

/**
 * Auth service with functions for authentication
 */
export const authService = {
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange(callback)
  },

  /**
   * Sign in a user with email and password.
   */
  async signIn({ email, password }: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log(`Signing in user with email: ${email}`)

      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          console.log(
            '[signIn] User email not confirmed. Initiating OTP resend...'
          )

          const resendResult = await this.resendOtp({ email })

          if (resendResult.error) {
            console.error(
              '[signIn] Failed to resend OTP during sign-in attempt:',
              resendResult.error
            )
            return { error: resendResult.error }
          }

          console.log(
            '[signIn] OTP resent successfully. Redirecting to verification page.'
          )
          if (typeof window !== 'undefined') {
            window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`
          }

          return { data: { message: 'Redirecting to email verification...' } }
        }

        console.error('Supabase signIn error:', error)
        return {
          error: {
            message: error.message,
            code: mapErrorCodeToAuthErrorCode(error.message),
          },
        }
      }

      if (data?.user && data?.session) {
        useAuthStore.setState({
          user: data.user,
          session: data.session,
          isAuthenticated: true,
          isLoading: false,
        })
      }

      return { data }
    } catch (error: unknown) {
      const err = error as Error
      console.error('Sign in error:', err)
      return {
        error: {
          message: err.message || 'An error occurred during sign in',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Sign up a new user with email and password using OTP
   */
  async signUp({ email, password }: SignupCredentials): Promise<AuthResponse> {
    try {
      console.log(`Signing up user with email: ${email}`)

      const supabase = createClient()

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        })

      if (signUpError) {
        console.error('Supabase signUp error:', signUpError)
        return {
          error: {
            message: signUpError.message,
            code: mapErrorCodeToAuthErrorCode(signUpError.message),
          },
        }
      }

      if (signUpData?.user?.identities?.length === 0) {
        console.log(
          'User exists but email not confirmed. Redirecting to verification...'
        )

        if (typeof window !== 'undefined') {
          window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`
        }
        return { data: { user: signUpData.user, session: null } }
      }

      if (signUpData.session && signUpData.user) {
        console.log(
          'Signup successful and email confirmation disabled. Updating store and redirecting to onboarding.'
        )

        useAuthStore.setState({
          user: signUpData.user,
          session: signUpData.session,
          isAuthenticated: true,
          isLoading: false,
        })

        if (typeof window !== 'undefined') {
          window.location.href = '/onboarding/basic-info'
        }
        return { data: signUpData }
      }

      if (!signUpData.session && signUpData.user) {
        console.log(
          'Signup successful, email confirmation enabled. Supabase already sent confirmation email.'
        )

        if (typeof window !== 'undefined') {
          window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`
        }
        return { data: { user: signUpData.user, session: null } }
      }

      console.warn('Unexpected state after signup attempt.')
      return {
        error: {
          message: 'Unexpected state after signup.',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    } catch (error: unknown) {
      const err = error as Error
      console.error('Sign up error caught in service:', err)
      return {
        error: {
          message: err.message || 'An error occurred during sign up',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Verify OTP code for email verification
   */
  async verifyOtp({
    email,
    token,
  }: {
    email: string
    token: string
  }): Promise<AuthResponse> {
    try {
      console.log(`Verifying OTP for email: ${email}`)

      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) {
        console.error('OTP verification error:', error)
        return {
          error: {
            message: error.message,
            code: mapErrorCodeToAuthErrorCode(error.message),
          },
        }
      }

      if (data.session && data.user) {
        console.log(
          'OTP verification successful. Updating store and redirecting to onboarding.'
        )

        useAuthStore.setState({
          user: data.user,
          session: data.session,
          isAuthenticated: true,
          isLoading: false,
        })

        if (typeof window !== 'undefined') {
          window.location.href = '/onboarding/basic-info'
        }
      }

      return { data }
    } catch (error: unknown) {
      const err = error as Error
      console.error('OTP verification error caught in service:', err)
      return {
        error: {
          message: err.message || 'An error occurred during OTP verification',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Resend OTP code with better rate limiting handling
   */
  async resendOtp({ email }: { email: string }): Promise<AuthResponse> {
    try {
      console.log(`Resending OTP for email: ${email}`)

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) {
        console.error('Resend OTP error:', error)

        if (error.message.includes('you can only request this after')) {
          const match = error.message.match(/(\d+) seconds/)
          const waitTime = match ? parseInt(match[1]) : 60

          return {
            error: {
              message: `Please wait ${waitTime} seconds before requesting another code. You can also check your email for the previous verification code.`,
              code: AuthErrorCode.TOO_MANY_ATTEMPTS,
            },
          }
        }

        return {
          error: {
            message: error.message,
            code: mapErrorCodeToAuthErrorCode(error.message),
          },
        }
      }

      return { data: true }
    } catch (error: unknown) {
      const err = error as Error
      console.error('Resend OTP error caught in service:', err)
      return {
        error: {
          message: err.message || 'An error occurred while resending OTP',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResponse> {
    try {
      console.log('Initiating sign out process...')

      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(
          'Server-side signout failed:',
          response.status,
          await response.text()
        )
        throw new Error('Server failed to sign out')
      }

      console.log('Server-side signout successful.')

      if (typeof window !== 'undefined') {
        console.log('Redirecting to /login?logout=success')
        window.location.href = '/pt-BR/login?logout=success'
      }

      return { data: true }
    } catch (error: unknown) {
      const err = error as Error
      console.error('Sign out error:', err)

      if (typeof window !== 'undefined') {
        console.log('Redirecting to /login?error=signout_failed due to error')
        window.location.href = '/pt-BR/login?error=signout_failed'
      }

      return {
        error: {
          message: err.message || 'An error occurred during sign out',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Reset password with email
   */
  async resetPassword({
    email,
  }: ResetPasswordCredentials): Promise<AuthResponse> {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) {
        return {
          error: {
            message: error.message,
            code: mapErrorCodeToAuthErrorCode(error.message),
          },
        }
      }

      return { data: true }
    } catch (error: unknown) {
      const err = error as Error
      return {
        error: {
          message: err.message || 'An error occurred during password reset',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Update password for the current user
   */
  async updatePassword({
    password,
  }: UpdatePasswordCredentials): Promise<AuthResponse> {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        return {
          error: {
            message: error.message,
            code: mapErrorCodeToAuthErrorCode(error.message),
          },
        }
      }

      return { data: true }
    } catch (error: unknown) {
      const err = error as Error
      return {
        error: {
          message: err.message || 'An error occurred during password update',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Get the current user session
   */
  async getSession(): Promise<AuthResponse> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        return {
          error: {
            message: error.message,
            code: mapErrorCodeToAuthErrorCode(error.message),
          },
        }
      }

      return { data: data.session }
    } catch (error: unknown) {
      const err = error as Error
      return {
        error: {
          message: err.message || 'An error occurred getting session',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Get the current user
   */
  async getUser(): Promise<AuthResponse> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        return {
          error: {
            message: error.message,
            code: AuthErrorCode.UNKNOWN_ERROR,
          },
        }
      }

      return { data: { user: data.user, session: null } }
    } catch (error: unknown) {
      const err = error as Error
      return {
        error: {
          message: err.message || 'An error occurred while fetching the user',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Get user profile from the user_profiles table
   */
  async getUserProfile(
    userId: string
  ): Promise<AuthResponse<UserProfile | null>> {
    console.log(`[authService] Getting user profile for user: ${userId}`)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error(
          `[authService] Supabase error fetching profile for user ${userId}:`,
          error
        )
        return {
          data: null,
          error: {
            message: error.message,
            code: AuthErrorCode.DATABASE_ERROR,
          },
        }
      }

      if (data) {
        console.log(
          `[authService] Successfully fetched profile for user ${userId}.`
        )
      } else {
        console.warn(
          `[authService] No profile found for user ${userId}, returning null.`
        )
      }

      return { data: data as UserProfile | null }
    } catch (error: unknown) {
      const err = error as Error
      console.error(
        `[authService] Catch block error fetching profile for user ${userId}:`,
        err
      )
      return {
        data: null,
        error: {
          message:
            err.message || 'An error occurred while fetching the user profile',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  async createUserProfile(
    profile: Database['public']['Tables']['user_profiles']['Insert']
  ): Promise<AuthResponse<UserProfile>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single()

      if (error) {
        return {
          error: {
            message: error.message,
            code: AuthErrorCode.UNKNOWN_ERROR,
          },
        }
      }

      return { data }
    } catch (error: unknown) {
      const err = error as Error
      return {
        error: {
          message: err.message || 'An error occurred creating user profile',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Update a user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Database['public']['Tables']['user_profiles']['Update']
  ): Promise<AuthResponse<UserProfile>> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        return {
          error: {
            message: error.message,
            code: AuthErrorCode.UNKNOWN_ERROR,
          },
        }
      }

      return { data }
    } catch (error: unknown) {
      const err = error as Error
      return {
        error: {
          message: err.message || 'An error occurred updating user profile',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Force sign out - emergency reset
   */
  async forceSignOut(): Promise<AuthResponse> {
    try {
      console.log('[EMERGENCY] Force sign out initiated')

      if (typeof window !== 'undefined') {
        console.log('[EMERGENCY] Clearing localStorage...')
        localStorage.clear()
        console.log('[EMERGENCY] Clearing sessionStorage...')
        sessionStorage.clear()

        console.log('[EMERGENCY] Attempting cookie clearing...')
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
        })
      }

      try {
        console.log('[EMERGENCY] Calling server-side signout endpoint...')
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (apiError) {
        console.warn(
          '[EMERGENCY] Server endpoint call failed, proceeding with redirect:',
          apiError
        )
      }

      if (typeof window !== 'undefined') {
        console.log('[EMERGENCY] Redirecting to /login?force_reset=true')
        window.location.href = '/pt-BR/login?force_reset=true'
      }

      return { data: true }
    } catch (error: unknown) {
      const err = error as Error
      console.error('[EMERGENCY] Error during force sign out:', err)
      if (typeof window !== 'undefined') {
        console.log(
          '[EMERGENCY] Redirecting to /login?force_reset=true after error'
        )
        window.location.href = '/pt-BR/login?force_reset=true'
      }
      return {
        error: {
          message: err.message || 'An error occurred during emergency sign out',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Sign in with a third-party provider
   */
  async signInWithProvider(
    provider: 'google' | 'github' | 'facebook' | 'twitter',
    redirectedFrom?: string | null
  ): Promise<AuthResponse> {
    try {
      let redirectUrl = `${window.location.origin}/auth/callback`

      if (redirectedFrom) {
        redirectUrl += `?redirectedFrom=${encodeURIComponent(redirectedFrom)}`
      }

      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        console.error(`Error during OAuth sign-in with ${provider}:`, error)

        if (provider === 'google' && error.message.includes('popup')) {
          return {
            error: {
              message:
                'Please disable popup blockers and try again. If the issue persists, try using a different browser.',
              code: AuthErrorCode.NETWORK_ERROR,
            },
          }
        }

        return {
          error: {
            message: error.message,
            code: mapErrorCodeToAuthErrorCode(error.message),
          },
        }
      }

      return { data: true }
    } catch (error: unknown) {
      const err = error as Error
      console.error(`Provider sign-in error for ${provider}:`, err)
      return {
        error: {
          message:
            err.message || `An error occurred during ${provider} sign in`,
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },

  /**
   * Refreshes the session and updates the auth state
   */
  async refreshSession(): Promise<AuthResponse> {
    try {
      console.log('[Auth Service] Refreshing session')
      const supabase = createClient()
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('[Auth Service] Error refreshing session:', error)
        return {
          error: {
            message: error.message,
            code: mapErrorCodeToAuthErrorCode(error.message),
          },
        }
      }

      console.log('[Auth Service] Session refreshed successfully')
      return { data }
    } catch (error: unknown) {
      const err = error as Error
      return {
        error: {
          message: err.message || 'An error occurred refreshing session',
          code: AuthErrorCode.UNKNOWN_ERROR,
        },
      }
    }
  },
}

/**
 * Map error messages to auth error codes
 */
function mapErrorCodeToAuthErrorCode(errorMessage: string): AuthErrorCode {
  const lowerCaseMessage = errorMessage.toLowerCase()

  if (
    lowerCaseMessage.includes('invalid login credentials') ||
    lowerCaseMessage.includes('invalid email or password')
  ) {
    return AuthErrorCode.INVALID_CREDENTIALS
  }

  if (
    lowerCaseMessage.includes('user already registered') ||
    lowerCaseMessage.includes('email address is already in use')
  ) {
    return AuthErrorCode.EMAIL_ALREADY_EXISTS
  }

  if (
    lowerCaseMessage.includes('password should be at least') ||
    lowerCaseMessage.includes('password')
  ) {
    return AuthErrorCode.WEAK_PASSWORD
  }

  if (lowerCaseMessage.includes('user not found')) {
    return AuthErrorCode.USER_NOT_FOUND
  }

  if (
    lowerCaseMessage.includes('too many attempts') ||
    lowerCaseMessage.includes('you can only request this after') ||
    lowerCaseMessage.includes('for security purposes')
  ) {
    return AuthErrorCode.TOO_MANY_ATTEMPTS
  }

  if (lowerCaseMessage.includes('expired')) {
    return AuthErrorCode.EXPIRED_CODE
  }

  if (lowerCaseMessage.includes('invalid code')) {
    return AuthErrorCode.INVALID_CODE
  }

  if (lowerCaseMessage.includes('network')) {
    return AuthErrorCode.NETWORK_ERROR
  }

  return AuthErrorCode.UNKNOWN_ERROR
}
