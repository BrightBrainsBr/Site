// app/auth/signout/page.tsx
// v2

// app/auth/signout/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuthHook as useAuth } from '@/auth/services_and_hooks/useAuthHook'

export default function SignOutPage() {
  const router = useRouter()
  const { user, isLoading, signOutAsync } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setError(null)

    try {
      console.log('[SignOut] Starting sign out process...')

      // First, call our server API endpoint to clear the server-side session
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.warn(
          '[SignOut] Server-side logout failed, but continuing with client-side logout'
        )
      }

      // Then clear client-side state
      await signOutAsync()

      console.log('[SignOut] Sign out completed successfully')
      setSuccess(true)

      // Automatically redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/pt-BR/login')
      }, 2000)
    } catch (err) {
      console.error('[SignOut] Sign out error:', err)
      setError('Failed to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  // Automatically sign out when the page loads
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // We have a user, so sign them out
        handleSignOut()
      } else {
        // Already signed out
        console.log('[SignOut] User already signed out')
        setSuccess(true)
        setTimeout(() => {
          router.push('/pt-BR/login')
        }, 1000)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when auth state resolves
  }, [isLoading, user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-y-2 border-secondary mb-4" />
            <p className="text-gray-300 text-center">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          Signing Out
        </h1>

        {isSigningOut ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-y-2 border-secondary mb-4" />
            <p className="text-gray-300 text-center">
              Please wait while we sign you out...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-gray-300 mb-4">Successfully signed out!</p>
            <p className="text-gray-400 text-sm mb-4">
              Redirecting to login page...
            </p>
            <button
              onClick={() => router.push('/pt-BR/login')}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors"
            >
              Sign In Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// v1
// // app/auth/signout/page.tsx
// 'use client';

// import { useRouter } from 'next/navigation';
// import { useEffect,useState } from 'react';

// import { useAuthHook as useAuth } from '@/auth/services_and_hooks/useAuthHook';

// export default function SignOutPage() {
//   const router = useRouter();
//   const { user, isLoading, signOutAsync } = useAuth();
//   const [error, setError] = useState<string | null>(null);
//   const [isSigningOut, setIsSigningOut] = useState(false);
//   const [success, setSuccess] = useState(false);

//   const handleSignOut = async () => {
//     setIsSigningOut(true);
//     try {
//       // First, call our server API endpoint to clear the server-side session
//       const response = await fetch('/api/auth/signout', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Server-side logout failed');
//       }

//       // Then clear client-side state
//       await signOutAsync();
//       // Mark signout as successful (signOut doesn't return a result object)
//       setSuccess(true);

//       // Automatically redirect to login after 2 seconds
//       setTimeout(() => {
//         router.push('/login');
//       }, 2000);
//     } catch (err) {
//       setError('Failed to sign out. Please try again.');
//       console.error('Sign out error:', err);
//     } finally {
//       setIsSigningOut(false);
//     }
//   };

//   // Automatically sign out when the page loads
//   useEffect(() => {
//     // Only attempt signout if we have a user to sign out
//     if (!isLoading && user) {
//       handleSignOut();
//     } else if (!isLoading && !user) {
//       // Already signed out
//       setSuccess(true);
//     }
//   }, [isLoading, user]);

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
//       <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
//         <h1 className="text-2xl font-bold text-white mb-4 text-center">Signing Out</h1>

//         {isLoading || isSigningOut ? (
//           <div className="flex flex-col items-center justify-center py-6">
//             <div className="animate-spin rounded-full h-12 w-12 border-y-2 border-secondary mb-4" />
//             <p className="text-gray-300 text-center">Please wait while we sign you out...</p>
//           </div>
//         ) : error ? (
//           <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-4">
//             <p className="text-red-300 text-center">{error}</p>
//             <div className="flex justify-center mt-4">
//               <button
//                 onClick={handleSignOut}
//                 className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark"
//               >
//                 Try Again
//               </button>
//             </div>
//           </div>
//         ) : success ? (
//           <div className="text-center">
//             <p className="text-gray-300 mb-4">Successfully signed out!</p>
//             <p className="text-gray-400 text-sm mb-4">Redirecting to login page...</p>
//             <button
//               onClick={() => router.push('/login')}
//               className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark"
//             >
//               Sign In Again
//             </button>
//           </div>
//         ) : null}
//       </div>
//     </div>
//   );
// }
