// app/auth/authForm.tsx
// app/auth/AuthForm.tsx
// app/auth/authForm.tsx
'use client'

// import { Auth } from '@supabase/auth-ui-react';
// import { ThemeSupa } from '@supabase/auth-ui-shared';
// Icons
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { authService } from '@/auth/services_and_hooks/authService'
import { useAuthHook } from '@/auth/services_and_hooks/useAuthHook'
import { createClient } from '~/utils/supabase/client'

interface AuthFormProps {
  view: 'sign_in' | 'sign_up' | 'forgotten_password'
  redirectedFrom?: string // Optional: where user intended to go
  onSuccess?: () => void // Optional callback on success
  onError?: (error: Error) => void // Optional callback on error
  hideProviders?: boolean // Hide Google sign-in button
  hidePassword?: boolean // Hide password field (for reset password)
}

type AuthFormData = {
  email: string
  password: string
}

export function AuthForm({
  view,
  redirectedFrom,
  onSuccess,
  onError,
  hideProviders = false,
  hidePassword = false,
}: AuthFormProps) {
  const supabase = createClient()
  const router = useRouter()
  // const searchParams = useSearchParams();
  const { user, isLoading, hasCompletedOnboarding } = useAuthHook() // Get status from hook

  // Local error state for Auth UI specific issues
  const [authError, setAuthError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false)
  const [showGoogleFallback, setShowGoogleFallback] = useState(false)
  const [googleAuthRetries, setGoogleAuthRetries] = useState(0)

  // React Hook Form setup
  const {
    control,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<AuthFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur', // Validate on blur for better UX
  })

  // Construct the absolute redirect URL for OAuth providers
  // Needs to point to the /auth/callback route
  // const getRedirectURL = () => {
  //    if (typeof window !== 'undefined') {
  //        // Pass the original intended destination (redirectedFrom) to the callback
  //        const callbackUrl = new URL('/auth/callback', window.location.origin);
  //        if (redirectedFrom) {
  //           callbackUrl.searchParams.set('redirectedFrom', redirectedFrom);
  //        }
  //        return callbackUrl.toString();
  //    }
  //    return '/auth/callback'; // Fallback (should ideally not be used by provider)
  // };

  // Custom form submission
  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true)
    setAuthError(null)

    try {
      if (view === 'sign_up') {
        console.warn('Attempting signup with email:', data.email)
        const result = await authService.signUp({
          email: data.email,
          password: data.password,
        })

        if (result.error) {
          console.error('Signup error:', result.error)

          // Handle rate limiting with better user experience
          if (
            result.error.code === 'too_many_attempts' ||
            result.error.message.includes('you can only request this after')
          ) {
            setAuthError(
              'Too many verification attempts. Please wait a minute before trying again, or check your email for a previous verification code.'
            )

            // Extract seconds from error message if possible
            const match = result.error.message.match(/(\d+) seconds/)
            if (match) {
              setCooldownSeconds(parseInt(match[1]))
            } else {
              setCooldownSeconds(60) // Default to 60 seconds
            }
          } else if (result.error.message.includes('User already registered')) {
            setAuthError(
              'An account with this email already exists. Please sign in instead.'
            )
          } else {
            setAuthError(result.error.message)
          }
        } else {
          console.warn('Signup successful, should redirect via authService')
          // The authService handles the redirect
        }
      } else if (view === 'sign_in') {
        console.warn('Attempting signin with email:', data.email)
        const result = await authService.signIn({
          email: data.email,
          password: data.password,
        })

        if (result.error) {
          console.error('Signin error:', result.error)
          setAuthError(result.error.message)
        } else {
          console.warn('Signin successful')
          // The authService should handle redirect
        }
      } else if (view === 'forgotten_password') {
        console.warn('Attempting password reset for email:', data.email)
        const result = await authService.resetPassword({ email: data.email })

        if (result.error) {
          console.error('Password reset error:', result.error)
          // For security, always show success message even on error
        }

        // Always show success message for security (don't reveal if email exists)
        setAuthError(null)
        setResetPasswordSuccess(true)

        // Call onSuccess if provided, but don't redirect automatically
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error)
      setAuthError(error.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: any | null) => {
        console.warn(`[AuthForm] Auth Event: ${event}`, session)

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          console.warn('[AuthForm] Signed In or User Updated event received.')
          console.warn('[AuthForm] Redirect context', {
            redirectedFrom,
            hasCompletedOnboarding,
          })
          // Check onboarding status from the hook *after* sign in event
          // This relies on the hook updating quickly after the event
          if (onSuccess) {
            console.warn('[AuthForm] Calling onSuccess callback.')
            onSuccess() // Signal success to parent
          } else {
            // Default redirect logic if no onSuccess provided (might be redundant with page-level logic)
            // Prefer redirectedFrom first; middleware will handle onboarding if needed
            const finalRedirect =
              redirectedFrom ||
              (hasCompletedOnboarding ? '/dashboard' : '/onboarding/basic-info')
            console.warn(`[AuthForm] Default redirecting to: ${finalRedirect}`)
            // router.replace(finalRedirect); // Careful with double redirects
            window.location.href = finalRedirect // More direct redirect
          }
        } else if (event === 'SIGNED_OUT') {
          console.warn('[AuthForm] Signed Out event received.')
          // Usually handled by sign out button/hook, but can reset form state if needed
          router.push('/login') // Go to login on sign out
        } else if (event === 'USER_ADDED') {
          console.warn(
            '[AuthForm] USER_ADDED event - user signed up, redirecting to verify email'
          )
          setIsRedirecting(true)
          // Get the email from the session/user if available
          const userEmail = session?.user?.email
          if (userEmail) {
            window.location.href = `/auth/verify-email?email=${encodeURIComponent(userEmail)}`
          } else {
            window.location.href = '/auth/verify-email'
          }
        } else if (
          event === 'SIGN_IN_ERROR' ||
          event === 'SIGN_UP_ERROR' ||
          event === 'PASSWORD_RECOVERY_ERROR' ||
          event === 'USER_DELETED' // Handle other error/edge cases
        ) {
          console.error(`[AuthForm] Auth Error Event: ${event}`, session)
          // Try to extract a meaningful error message
          let errorMessage = 'An authentication error occurred.'
          if (session?.user === null && event.includes('ERROR')) {
            // Attempt to get specific error from Supabase internal state or props if available
            // This part is tricky as the error isn't always directly in the event payload
            errorMessage = `Login failed. Please check credentials or use another method. (${event})`
          }
          setAuthError(errorMessage) // Update local state
          if (onError) {
            onError(new Error(errorMessage)) // Propagate error via callback
          }
        }
      }
    )

    // Cleanup listener
    return () => {
      authListener?.subscription.unsubscribe()
    }
    // Add dependencies: supabase, router, hasCompletedOnboarding, redirectedFrom, onSuccess, onError
  }, [
    supabase,
    router,
    hasCompletedOnboarding,
    redirectedFrom,
    onSuccess,
    onError,
  ])

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (cooldownSeconds === 0 && authError?.includes('wait a minute')) {
      // Clear the error when cooldown is over
      setAuthError(null)
    }
  }, [cooldownSeconds, authError])

  // Show success state for password reset
  if (view === 'forgotten_password' && resetPasswordSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Check your email
        </h3>
        <p className="text-gray-600 mb-6">
          We've sent password reset instructions to your email address.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => {
                setResetPasswordSuccess(false)
                setAuthError(null)
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              try again
            </button>
          </p>
          <p className="text-sm text-gray-500">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Display local Auth Errors */}
      {authError && (
        <div className="mb-4 p-3 bg-error/10 border border-error rounded-md text-error text-sm">
          {authError}
        </div>
      )}

      {/* Show redirecting message instead of Auth form when redirecting */}
      {isRedirecting ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">
            Redirecting to verification...
          </p>
        </div>
      ) : (
        <>
          {/* CSS to hide Auth UI confirmation messages */}
          {/* Custom Form */}
          <form onSubmit={submitForm(onSubmit)} className="space-y-4">
            {/* Google OAuth Section - Hidden for reset password */}
            {!hideProviders && (
              <>
                {showGoogleFallback ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                    <p className="text-sm text-amber-800">
                      Google sign-in is having issues. Please use email sign-in
                      instead.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGoogleFallback(false)
                        setAuthError(null)
                      }}
                      className="mt-2 text-sm font-medium text-amber-700 hover:underline"
                    >
                      Use email instead
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      console.warn('Attempting Google OAuth sign-in...')
                      const result = await authService.signInWithProvider(
                        'google',
                        redirectedFrom
                      )
                      if (result.error) {
                        console.error('Google OAuth error:', result.error)

                        // Check if it's a "Use secure browsers" type error
                        if (
                          result.error.message.includes('popup') ||
                          result.error.message.includes('secure') ||
                          result.error.message.includes('browser') ||
                          result.error.code === 'network_error'
                        ) {
                          setShowGoogleFallback(true)
                        } else {
                          setAuthError(result.error.message)
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {view === 'sign_up'
                      ? 'Sign up with Google'
                      : 'Sign in with Google'}
                  </button>
                )}

                {/* Divider - Only show if not showing Google fallback */}
                {!showGoogleFallback && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /.+@.+\..+/,
                  message: 'Please enter a valid email address',
                },
              }}
              render={({ field, fieldState }) => (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    {...field}
                    type="email"
                    placeholder="Your email address"
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-gray-500 focus:ring-gray-500"
                  />
                  {fieldState.error && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Password Input - Hidden for reset password */}
            {!hidePassword && (
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters long',
                  },
                }}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {view === 'sign_up' ? 'Create a Password' : 'Password'}
                    </label>
                    <input
                      {...field}
                      type="password"
                      placeholder={
                        view === 'sign_up'
                          ? 'Create your password'
                          : 'Your password'
                      }
                      autoComplete={
                        view === 'sign_up' ? 'new-password' : 'current-password'
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-gray-500 focus:ring-gray-500"
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || cooldownSeconds > 0}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  {view === 'sign_up'
                    ? 'Creating account...'
                    : view === 'forgotten_password'
                      ? 'Sending reset email...'
                      : 'Signing in...'}
                </div>
              ) : cooldownSeconds > 0 ? (
                `Please wait ${cooldownSeconds}s`
              ) : view === 'sign_up' ? (
                'Create account'
              ) : view === 'forgotten_password' ? (
                'Send reset email'
              ) : (
                'Sign in'
              )}
            </button>

            {/* Additional Links */}
            {view === 'sign_in' && (
              <div className="text-center">
                <Link
                  href="/reset-password"
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            {view === 'sign_up' && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  )
}
