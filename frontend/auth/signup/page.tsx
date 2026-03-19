// frontend/auth/signup/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// B2B: Signup is invite-only — show message and redirect to login
export default function SignUpRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pt-BR/empresa/login?message=invite_only');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-center text-gray-400">Redirecting to signup...</p>
    </div>
  );
} 