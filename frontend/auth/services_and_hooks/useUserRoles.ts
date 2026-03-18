// app/auth/services_and_hooks/useUserRoles.ts
'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuthHook } from './useAuthHook';

interface UniversityInfo {
  id: string;
  name: string;
  code: string;
}

interface AdminInfo {
  id: string;
  email: string;
  name: string | null;
}

interface UniversityUserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  university: UniversityInfo;
}

interface UserRolesResponse {
  success: boolean;
  isAdmin: boolean;
  isUniversityUser: boolean;
  admin?: AdminInfo;
  universityUser?: UniversityUserInfo;
  error?: string;
}

/**
 * Hook to check if the current user has admin or university user roles.
 * Uses the /api/user/roles endpoint to check access permissions.
 * 
 * - isAdmin: User is in the admins table (can access /admin)
 * - isUniversityUser: User is in the university_users table (can access /university)
 * - Mindless admins can also access the university dashboard
 */
export function useUserRoles() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthHook();

  const rolesQuery = useQuery({
    queryKey: ['user-roles'],
    queryFn: async (): Promise<UserRolesResponse> => {
      const response = await fetch('/api/user/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch user roles');
      }
      return response.json();
    },
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    // Loading state
    isLoading: isAuthLoading || rolesQuery.isLoading,
    isError: rolesQuery.isError,
    error: rolesQuery.error,
    
    // Role checks
    isAdmin: rolesQuery.data?.isAdmin ?? false,
    isUniversityUser: rolesQuery.data?.isUniversityUser ?? false,
    
    // Admins can access university dashboard too
    canAccessUniversityDashboard: (rolesQuery.data?.isAdmin || rolesQuery.data?.isUniversityUser) ?? false,
    canAccessAdminDashboard: rolesQuery.data?.isAdmin ?? false,
    
    // User info
    admin: rolesQuery.data?.admin,
    universityUser: rolesQuery.data?.universityUser,
    
    // Refetch function
    refetch: rolesQuery.refetch,
  };
}
