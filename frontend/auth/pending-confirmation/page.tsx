// app/auth/pending-confirmation/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Loading fallback component
function PendingConfirmationLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-y-2 border-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Loading...</h2>
          <p className="text-gray-600">
            Setting up your confirmation page...
          </p>
        </div>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function PendingConfirmationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
            <svg className="mx-auto h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Check Your Inbox!</h2>
          <p className="text-gray-600">
            We&apos;ve sent a confirmation link to your email address.
          </p>
        </div>
        <div className="mt-4 space-y-4 text-center">
          {email && (
            <p className="text-lg font-medium text-gray-800">
              {email}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Please click the link in the email to activate your account and complete the signup process.
          </p>
          <p className="text-xs text-gray-400">
            If you don&apos;t see the email, please check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function PendingConfirmationPage() {
  return (
    <Suspense fallback={<PendingConfirmationLoading />}>
      <PendingConfirmationContent />
    </Suspense>
  );
}