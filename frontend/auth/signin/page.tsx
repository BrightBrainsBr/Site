// app/auth/signin/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirects /auth/signin to /login to keep the URL clean
export default function SignInRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Get any query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const queryString = urlParams.toString();
    
    // Redirect to /login with any existing query parameters
    const redirectPath = queryString ? `/login?${queryString}` : '/login';
    console.log(`Redirecting from /auth/signin to ${redirectPath}`);
    router.replace(redirectPath);
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-center text-gray-400">Redirecting to login...</p>
    </div>
  );
} 