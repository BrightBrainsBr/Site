// app/auth/pending-confirmation/page.tsx
'use client';

import { MailCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Loading fallback component
function PendingConfirmationLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-10 w-10 border-y-2 border-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Setting up your confirmation page...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

// Main content component that uses useSearchParams
function PendingConfirmationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-green-100 dark:bg-green-900">
            <MailCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Inbox!</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            We've sent a confirmation link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {email && (
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
              {email}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please click the link in the email to activate your account and complete the signup process.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            If you don't see the email, please check your spam folder.
          </p>
        </CardContent>
      </Card>
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