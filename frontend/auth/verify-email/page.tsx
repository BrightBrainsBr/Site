// app/auth/verify-email/page.tsx
'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import { authService } from '@/auth/services_and_hooks/authService'

// Loading component for suspense fallback
function VerifyEmailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-y-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading verification page...</p>
        </div>
      </div>
    </div>
  )
}

// Main content component that uses useSearchParams
function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digits

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('') // Clear error when user types

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }

    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    const newCode = [...code]

    for (let i = 0; i < 6; i++) {
      newCode[i] = pastedData[i] || ''
    }

    setCode(newCode)
    setError('')

    // Focus last filled input or next empty one
    const lastFilledIndex = pastedData.length - 1
    const focusIndex = Math.min(lastFilledIndex + 1, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleVerify = async () => {
    const verificationCode = code.join('')

    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const result = await authService.verifyOtp({
        email,
        token: verificationCode,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      // The authService handles the redirect automatically
      // But we can also redirect here if needed
      if (result.data) {
        console.warn(
          'OTP verification successful, should redirect via authService'
        )
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      setError(error.message || 'Invalid verification code. Please try again.')

      // Clear the code inputs
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError('Email address is missing. Please try signing up again.')
      return
    }

    setIsResending(true)
    setResendMessage('')
    setError('')

    try {
      const result = await authService.resendOtp({ email })

      if (result.error) {
        throw new Error(result.error.message)
      }

      setResendMessage('Verification code sent! Check your email.')
    } catch (error: any) {
      console.error('Resend error:', error)
      setError(error.message || 'Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Missing Email
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find your email address. Please try signing up
              again.
            </p>
            <Link
              href="/pt-BR/login"
              className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center font-medium text-white hover:bg-gray-800"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verify your email
          </h1>
          <p className="text-lg text-gray-600 mb-1">
            We sent a code to{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
          <p className="text-sm text-gray-500">
            Enter the 6-digit verification code below
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Code Input */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={isVerifying}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {resendMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{resendMessage}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || code.join('').length !== 6}
            className="w-full mb-4 rounded-lg bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </div>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isResending ? 'Sending...' : 'Send again'}
            </button>
          </div>

          {/* Back to login */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link
              href="/pt-BR/login"
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Wrong email? Go back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
