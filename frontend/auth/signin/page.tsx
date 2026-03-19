// frontend/auth/signin/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirects /auth/signin to /empresa/login (B2B HR login)
export default function SignInRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryString = urlParams.toString();
    const redirectPath = queryString
      ? `/pt-BR/empresa/login?${queryString}`
      : '/pt-BR/empresa/login';
    router.replace(redirectPath);
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-center text-gray-400">Redirecting to login...</p>
    </div>
  );
} 