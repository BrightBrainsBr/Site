// app/auth/signup/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirects /auth/signup to /signup to keep the URL clean
export default function SignUpRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Get any query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const queryString = urlParams.toString();
    
    // Redirect to /signup with any existing query parameters
    const redirectPath = queryString ? `/signup?${queryString}` : '/signup';
    console.log(`Redirecting from /auth/signup to ${redirectPath}`);
    router.replace(redirectPath);
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-center text-gray-400">Redirecting to signup...</p>
    </div>
  );
} 