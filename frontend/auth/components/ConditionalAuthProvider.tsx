// app/auth/components/ConditionalAuthProvider.tsx

'use client';

import { usePathname } from 'next/navigation';

import { AuthProvider } from '@/app/auth/components/authProvider';

// Routes that need auth functionality
const authRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/onboarding',
];

// Check if current path needs auth
function needsAuth(pathname: string): boolean {
  return authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

export function ConditionalAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldLoadAuth = needsAuth(pathname);

  console.log(`[ConditionalAuthProvider] Path: ${pathname}, Needs Auth: ${shouldLoadAuth}`);

  if (shouldLoadAuth) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  // For public routes, just render children without auth setup
  return <>{children}</>;
}