// app/auth/services_and_hooks/useAuthQueryHook.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type LoginCredentials } from '@/auth/auth.interface'
import { useToast } from '@/components/ui/use-toast'

import { authService } from './authService'
import { useAuthStore } from './authStore'

// Export the query keys that onboarding needs
export const authQueryKeys = {
  user: ['auth', 'user'] as const,
  session: ['auth', 'session'] as const,
  profile: (userId: string) => ['auth', 'profile', userId] as const,
}

export function useAuthQueryHook() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    setSession,
    setProfile,
    setLoading,
    reset: resetState,
  } = useAuthStore((state) => ({
    setSession: state.setSession,
    setProfile: state.setProfile,
    setLoading: state.setLoading,
    reset: state.reset,
  }))

  // Get current session
  const sessionQuery = useQuery({
    queryKey: authQueryKeys.session,
    queryFn: async () => {
      setLoading(true)
      try {
        const { data, error } = await authService.getSession()

        if (error) {
          resetState()
          setLoading(false)
          // Return empty object instead of null
          return { session: null, user: null }
        }

        setSession(data || null)

        if (data) {
          const userResponse = await authService.getUser()

          if (userResponse.data) {
            const profileResponse = await authService.getUserProfile(
              userResponse.data.id
            )
            const profileData = profileResponse.data || null
            setProfile(profileData)
          }
        } else {
          resetState()
        }

        setLoading(false)
        return { session: data, user: data?.user || null }
      } catch (error) {
        console.error('[useAuthQueryHook] Session query error:', error)
        resetState()
        setLoading(false)
        return { session: null, user: null }
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // All your mutations here (sign in, sign up, etc.)
  const signInMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.signIn(credentials),
    onSuccess: async (data) => {
      if (data.error) {
        toast({
          title: 'Sign in failed',
          description: data.error.message,
          variant: 'destructive',
        })
        return
      }

      await queryClient.invalidateQueries({ queryKey: authQueryKeys.session })

      toast({
        title: 'Signed in successfully',
        description: 'Welcome back!',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Sign in failed',
        description: error.message || 'An error occurred during sign in',
        variant: 'destructive',
      })
    },
  })

  // Add all other mutations from your document...

  return {
    sessionQuery,
    signIn: signInMutation.mutate,
    signInAsync: signInMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    signInError: signInMutation.error,
    // ... other methods
    refreshSession: () =>
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session }),
  }
}

// // !v2!

// // app/auth/services_and_hooks/useAuthQueryHook.ts
// 'use client';

// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { useToast } from '@/components/ui/use-toast';
// import { Database } from '@/types/supabase';

// import {
//   type LoginCredentials,
//   type ResetPasswordCredentials,
//   type SignupCredentials,
//   type UpdatePasswordCredentials,
// } from '../auth.interface';
// import { authService } from './authService';
// import { useAuthStore } from './authStore';

// /**
//  * Keys for auth-related queries
//  */
// export const authQueryKeys = {
//   user: ['auth', 'user'] as const,
//   session: ['auth', 'session'] as const,
//   profile: (userId: string) => ['auth', 'profile', userId] as const,
// };

// /**
//  * Hook for auth-related queries using TanStack Query
//  */
// export function useAuthQueryHook() {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   // ### CODE CHANGES START ###
//   // We now get all setters from the SINGLE unified useAuthStore.
//   const {
//     setSession,
//     setProfile,
//     setLoading,
//     reset: resetState, // Rename `reset` to `resetState` to avoid conflicts
//   } = useAuthStore((state) => ({
//     setSession: state.setSession,
//     setProfile: state.setProfile,
//     setLoading: state.setLoading,
//     reset: state.reset,
//   }));
//   // ### CODE CHANGES FINISH ###

//   // Get current session
//   const sessionQuery = useQuery({
//     queryKey: authQueryKeys.session,
//     queryFn: async () => {
//       setLoading(true);
//       const { data, error } = await authService.getSession();

//       if (error) {
//         resetState();
//         setLoading(false);
//         return null;
//       }

//       setSession(data || null);

//       if (data) {
//         const userResponse = await authService.getUser();

//         if (userResponse.data) {
//           const profileResponse = await authService.getUserProfile(userResponse.data.id);
//           const profileData = profileResponse.data || null;
//           // ### CODE CHANGES START ###
//           // The single setProfile action now updates the one true store.
//           setProfile(profileData);
//           // ### CODE CHANGES FINISH ###
//         }
//       } else {
//         resetState();
//       }

//       setLoading(false);
//       return data;
//     },
//     retry: false,
//     refetchOnWindowFocus: false,
//   });

//   // Sign in mutation
//   const signInMutation = useMutation({
//     mutationFn: (credentials: LoginCredentials) => authService.signIn(credentials),
//     onSuccess: async (data) => {
//       if (data.error) {
//         toast({
//           title: 'Sign in failed',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // ### CODE CHANGES START ###
//       // This is correct. Invalidating the session will trigger the sessionQuery to refetch,
//       // which in turn will update the entire auth state.
//       await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
//       // ### CODE CHANGES FINISH ###

//       toast({
//         title: 'Signed in successfully',
//         description: 'Welcome back!',
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Sign in failed',
//         description: error.message || 'An error occurred during sign in',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Sign up mutation
//   const signUpMutation = useMutation({
//     mutationFn: (credentials: SignupCredentials) => authService.signUp(credentials),
//     onSuccess: async (data) => {
//       if (data.error) {
//         toast({
//           title: 'Sign up failed',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       const needsEmailConfirmation = !data.data?.session;

//       if (needsEmailConfirmation) {
//         toast({
//           title: 'Sign up successful',
//           description: 'Please check your email to confirm your account.',
//         });
//       } else {
//         await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
//         toast({
//           title: 'Account created successfully',
//           description: 'Welcome to the platform!',
//         });
//       }
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Sign up failed',
//         description: error.message || 'An error occurred during sign up',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Sign out mutation
//   const signOutMutation = useMutation({
//     mutationFn: () => authService.signOut(),
//     onSuccess: async (data) => {
//       if (data.error) {
//         toast({
//           title: 'Sign out failed',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // ### CODE CHANGES START ###
//       // This is now simpler and correct. resetState handles everything.
//       resetState();
//       // Clear all react-query cache to ensure no stale data remains.
//       queryClient.clear();
//       // ### CODE CHANGES FINISH ###

//       toast({
//         title: 'Signed out successfully',
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Sign out failed',
//         description: error.message || 'An error occurred during sign out',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Reset password mutation
//   const resetPasswordMutation = useMutation({
//     mutationFn: (credentials: ResetPasswordCredentials) => authService.resetPassword(credentials),
//     onSuccess: (data) => {
//       if (data.error) {
//         toast({ title: 'Password reset failed', description: data.error.message, variant: 'destructive' });
//         return;
//       }
//       toast({ title: 'Password reset email sent', description: 'Please check your email for password reset instructions' });
//     },
//     onError: (error: Error) => {
//       toast({ title: 'Password reset failed', description: error.message, variant: 'destructive' });
//     },
//   });

//   // Update password mutation
//   const updatePasswordMutation = useMutation({
//     mutationFn: (credentials: UpdatePasswordCredentials) => authService.updatePassword(credentials),
//     onSuccess: (data) => {
//       if (data.error) {
//         toast({ title: 'Password update failed', description: data.error.message, variant: 'destructive' });
//         return;
//       }
//       toast({ title: 'Password updated successfully' });
//     },
//     onError: (error: Error) => {
//       toast({ title: 'Password update failed', description: error.message, variant: 'destructive' });
//     },
//   });

//   // Create user profile mutation
//   const createUserProfileMutation = useMutation({
//     mutationFn: (profile: Database['public']['Tables']['user_profiles']['Insert']) => {
//       if (!profile.first_name || !profile.last_name) {
//         return Promise.reject(new Error('First name and last name are required'));
//       }
//       return authService.createUserProfile(profile);
//     },
//     onSuccess: (data) => {
//       if (data.error) {
//         toast({ title: 'Failed to create profile', description: data.error.message, variant: 'destructive' });
//         return;
//       }
//       // ### CODE CHANGES START ###
//       // Correctly update the profile in the unified store
//       setProfile(data.data || null);
//       // ### CODE CHANGES FINISH ###
//       toast({ title: 'Profile created successfully' });
//     },
//     onError: (error: Error) => {
//       toast({ title: 'Failed to create profile', description: error.message, variant: 'destructive' });
//     },
//   });

//   // Update user profile mutation
//   const updateUserProfileMutation = useMutation({
//     mutationFn: ({ userId, updates }: { userId: string; updates: Database['public']['Tables']['user_profiles']['Update'] }) => {
//       return authService.updateUserProfile(userId, updates);
//     },
//     onSuccess: (data) => {
//       if (data.error) {
//         toast({ title: 'Failed to update profile', description: data.error.message, variant: 'destructive' });
//         return;
//       }
//       // ### CODE CHANGES START ###
//       // Correctly update the profile in the unified store
//       setProfile(data.data || null);
//       // The hasCompletedOnboarding flag is now automatically derived inside the store's setProfile action.
//       // ### CODE CHANGES FINISH ###
//       toast({ title: 'Profile updated successfully' });
//     },
//     onError: (error: Error) => {
//       toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
//     },
//   });

//   // signInWithProvider remains unchanged as it's a pure action.
//   const signInWithProvider = async (
//     provider: 'google' | 'github' | 'facebook' | 'twitter',
//     redirectedFrom?: string | null
//   ) => {
//     try {
//       const result = await authService.signInWithProvider(provider, redirectedFrom);
//       if (result.error) {
//          toast({ title: `Sign in with ${provider} failed`, description: result.error.message, variant: 'destructive' });
//       }
//     } catch (error) {
//         toast({ title: `Sign in with ${provider} failed`, description: error instanceof Error ? error.message : 'An unknown error occurred.', variant: 'destructive' });
//     }
//   };

//   return {
//     // Queries
//     sessionQuery,

//     // Auth mutations
//     signIn: signInMutation.mutate,
//     signInAsync: signInMutation.mutateAsync,
//     isSigningIn: signInMutation.isPending,
//     signInError: signInMutation.error,

//     signUp: signUpMutation.mutate,
//     signUpAsync: signUpMutation.mutateAsync,
//     isSigningUp: signUpMutation.isPending,
//     signUpError: signUpMutation.error,

//     signOut: signOutMutation.mutate,
//     signOutAsync: signOutMutation.mutateAsync,
//     isSigningOut: signOutMutation.isPending,

//     resetPassword: resetPasswordMutation.mutate,
//     resetPasswordAsync: resetPasswordMutation.mutateAsync,
//     isResettingPassword: resetPasswordMutation.isPending,

//     updatePassword: updatePasswordMutation.mutate,
//     updatePasswordAsync: updatePasswordMutation.mutateAsync,
//     isUpdatingPassword: updatePasswordMutation.isPending,

//     signInWithProvider,
//     // Profile mutations
//     createUserProfile: createUserProfileMutation.mutate,
//     createUserProfileAsync: createUserProfileMutation.mutateAsync,
//     isCreatingProfile: createUserProfileMutation.isPending,

//     updateUserProfile: updateUserProfileMutation.mutate,
//     updateUserProfileAsync: updateUserProfileMutation.mutateAsync,
//     isUpdatingProfile: updateUserProfileMutation.isPending,

//     // Helper methods
//     refreshSession: () => queryClient.invalidateQueries({ queryKey: authQueryKeys.session }),
//   };
// }

// v1
// // app/auth/services_and_hooks/useAuthQueryHook.ts
// 'use client';

// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// import { useToast } from '@/components/ui/use-toast';
// import { Database } from '@/types/supabase';
// import { useUserStore } from '@/app/shared/store/userStore';

// import {
//   type LoginCredentials,
//   type ResetPasswordCredentials,
//   type SignupCredentials,
//   type UpdatePasswordCredentials,
// } from '../auth.interface';
// import { authService } from './authService';
// import { useAuthStore } from './authStore';

// /**
//  * Keys for auth-related queries
//  */
// export const authQueryKeys = {
//   user: ['auth', 'user'] as const,
//   session: ['auth', 'session'] as const,
//   profile: (userId: string) => ['auth', 'profile', userId] as const,
// };

// /**
//  * Hook for auth-related queries using TanStack Query
//  */
// export function useAuthQueryHook() {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   // Auth store actions
//   const {
//     setUser,
//     setSession,
//     setProfile,
//     setLoading,
//     resetState
//   } = useAuthStore();

//   // User store actions
//   const { setProfile: setUserStoreProfile } = useUserStore();

//   // Get current session
//   const sessionQuery = useQuery({
//     queryKey: authQueryKeys.session,
//     queryFn: async () => {
//       setLoading(true);
//       const { data, error } = await authService.getSession();

//       if (error) {
//         resetState();
//         setLoading(false);
//         return null;
//       }

//       // Update user state
//       setSession(data || null);

//       if (data) {
//         // If we have a session, also get the user
//         const userResponse = await authService.getUser();
//         setUser(userResponse.data || null);

//         // If we have a user, fetch their profile
//         if (userResponse.data) {
//           const profileResponse = await authService.getUserProfile(userResponse.data.id);
//           const profileData = profileResponse.data || null;
//           setProfile(profileData);

//           // Also update the user store with the profile
//           if (profileData) {
//             console.warn('[useAuthQueryHook] Updating user store with profile from auth session query.');
//             setUserStoreProfile(profileData);
//           }
//         }
//       } else {
//         resetState();
//       }

//       setLoading(false);
//       return data;
//     },
//     retry: false,
//     refetchOnWindowFocus: false,
//   });

//   // Sign in mutation
//   const signInMutation = useMutation({
//     mutationFn: (credentials: LoginCredentials) => authService.signIn(credentials),
//     onSuccess: async (data) => {
//       if (data.error) {
//         toast({
//           title: 'Sign in failed',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // Refetch session which will update the auth store and user store
//       queryClient.invalidateQueries({ queryKey: authQueryKeys.session });

//       toast({
//         title: 'Signed in successfully',
//         description: 'Welcome back!',
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Sign in failed',
//         description: error.message || 'An error occurred during sign in',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Sign up mutation
//   const signUpMutation = useMutation({
//     mutationFn: (credentials: SignupCredentials) => authService.signUp(credentials),
//     onSuccess: async (data) => {
//       if (data.error) {
//         toast({
//           title: 'Sign up failed',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // Check if the sign up was successful but requires email confirmation
//       const needsEmailConfirmation =
//         !data.data?.user?.confirmed_at ||
//         data.data?.user?.confirmation_sent_at;

//       if (needsEmailConfirmation) {
//         toast({
//           title: 'Sign up successful',
//           description: 'Please check your email to confirm your account',
//         });
//       } else {
//         // User is automatically signed in after sign up
//         queryClient.invalidateQueries({ queryKey: authQueryKeys.session });

//         toast({
//           title: 'Account created successfully',
//           description: 'Welcome to the platform!',
//         });
//       }
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Sign up failed',
//         description: error.message || 'An error occurred during sign up',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Sign out mutation
//   const signOutMutation = useMutation({
//     mutationFn: () => authService.signOut(),
//     onSuccess: async (data) => {
//       if (data.error) {
//         toast({
//           title: 'Sign out failed',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // Clear auth state
//       resetState();

//       // Clear user store profile as well
//       setUserStoreProfile(null);

//       // Clear all queries
//       queryClient.clear();

//       toast({
//         title: 'Signed out successfully',
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Sign out failed',
//         description: error.message || 'An error occurred during sign out',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Reset password mutation
//   const resetPasswordMutation = useMutation({
//     mutationFn: (credentials: ResetPasswordCredentials) => authService.resetPassword(credentials),
//     onSuccess: async (data) => {
//       if (data.error) {
//         toast({
//           title: 'Password reset failed',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       toast({
//         title: 'Password reset email sent',
//         description: 'Please check your email for password reset instructions',
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Password reset failed',
//         description: error.message || 'An error occurred during password reset',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Update password mutation
//   const updatePasswordMutation = useMutation({
//     mutationFn: (credentials: UpdatePasswordCredentials) => authService.updatePassword(credentials),
//     onSuccess: async (data) => {
//       if (data.error) {
//         toast({
//           title: 'Password update failed',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       toast({
//         title: 'Password updated successfully',
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Password update failed',
//         description: error.message || 'An error occurred during password update',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Create user profile mutation
//   const createUserProfileMutation = useMutation({
//     mutationFn: (profile: Database['public']['Tables']['user_profiles']['Insert']) => {
//       // Ensure the profile has the required fields
//       if (!profile.first_name || !profile.last_name) {
//         return Promise.reject(new Error('First name and last name are required'));
//       }

//       return authService.createUserProfile(profile);
//     },
//     onSuccess: async (data, variables) => {
//       if (data.error) {
//         toast({
//           title: 'Failed to create profile',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // Update profile in store
//       setProfile(data.data || null);

//       toast({
//         title: 'Profile created successfully',
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Failed to create profile',
//         description: error.message || 'An error occurred creating user profile',
//         variant: 'destructive',
//       });
//     },
//   });

//   // Update user profile mutation
//   const updateUserProfileMutation = useMutation({
//     mutationFn: ({ userId, updates }: { userId: string; updates: Database['public']['Tables']['user_profiles']['Update'] }) => {
//       return authService.updateUserProfile(userId, updates);
//     },
//     onSuccess: async (data, variables) => {
//       if (data.error) {
//         toast({
//           title: 'Failed to update profile',
//           description: data.error.message,
//           variant: 'destructive',
//         });
//         return;
//       }

//       // Update profile in store
//       setProfile(data.data || null);

//       // Set onboarding completed status based on business logic
//       useAuthStore.getState().setHasCompletedOnboarding(true);

//       toast({
//         title: 'Profile updated successfully',
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Failed to update profile',
//         description: error.message || 'An error occurred updating user profile',
//         variant: 'destructive',
//       });
//     },
//   });

//   const signInWithProvider = async (
//     provider: 'google' | 'github' | 'facebook' | 'twitter',
//     redirectedFrom?: string | null
//   ) => {
//     try {
//         // Optional: Set a loading state if needed, though redirect might be fast
//         // setLoading(true);
//       const result = await authService.signInWithProvider(provider, redirectedFrom);
//       if (result.error) {
//         // Show toast on error before potential redirect fails
//          toast({
//              title: `Sign in with ${provider} failed`,
//              description: result.error.message,
//              variant: 'destructive',
//          });
//          // setLoading(false);
//       }
//       // Redirect happens via Supabase if successful, no further client action needed here
//     } catch (error) {
//         console.error(`Error initiating sign in with ${provider}:`, error);
//          toast({
//              title: `Sign in with ${provider} failed`,
//              description: error instanceof Error ? error.message : 'An unknown error occurred.',
//              variant: 'destructive',
//          });
//          // setLoading(false);
//     }
//   };

//   return {
//     // Queries
//     sessionQuery,

//     // Auth mutations
//     signIn: signInMutation.mutate,
//     signInAsync: signInMutation.mutateAsync,
//     isSigningIn: signInMutation.isPending,
//     signInError: signInMutation.error,

//     signUp: signUpMutation.mutate,
//     signUpAsync: signUpMutation.mutateAsync,
//     isSigningUp: signUpMutation.isPending,
//     signUpError: signUpMutation.error,

//     signOut: signOutMutation.mutate,
//     signOutAsync: signOutMutation.mutateAsync,
//     isSigningOut: signOutMutation.isPending,

//     resetPassword: resetPasswordMutation.mutate,
//     resetPasswordAsync: resetPasswordMutation.mutateAsync,
//     isResettingPassword: resetPasswordMutation.isPending,

//     updatePassword: updatePasswordMutation.mutate,
//     updatePasswordAsync: updatePasswordMutation.mutateAsync,
//     isUpdatingPassword: updatePasswordMutation.isPending,

//     signInWithProvider,
//     // Profile mutations
//     createUserProfile: createUserProfileMutation.mutate,
//     createUserProfileAsync: createUserProfileMutation.mutateAsync,
//     isCreatingProfile: createUserProfileMutation.isPending,

//     updateUserProfile: updateUserProfileMutation.mutate,
//     updateUserProfileAsync: updateUserProfileMutation.mutateAsync,
//     isUpdatingProfile: updateUserProfileMutation.isPending,

//     // Helper methods
//     refreshSession: () => queryClient.invalidateQueries({ queryKey: authQueryKeys.session }),
//   };
// }
