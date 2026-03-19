// app/auth/signout/logoutService.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

/**
 * Server-side logout action - this is more secure than client-side logout
 * as it properly clears cookies on the server
 */
export async function logoutServerAction() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    
    // Sign out on the server
    await supabase.auth.signOut()

    // Force a redirect to the login page with a logout success message
    redirect('/pt-BR/empresa/login?logout=success')
  } catch (error) {
    console.error('Error during logout:', error)
    
    // Redirect to login with an error message
    redirect('/pt-BR/empresa/login?error=logout_failed')
  }
} 