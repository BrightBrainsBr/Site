// app/auth/confirm/route.ts
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient, createServiceClient } from '@/utils/supabase/server' 

// Redirect destinations
const REDIRECT_ONBOARDING = '/onboarding/basic-info'
const REDIRECT_ADMIN = '/admin/cohorts'
const REDIRECT_UNIVERSITY = '/university'
const REDIRECT_ACADEMY = '/academy'
const REDIRECT_ON_ERROR = '/login?error=confirmation_failed'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    console.log(`[Auth Confirm PKCE] Received code. Attempting to exchange for session.`);
    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const now = new Date().toISOString()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('[Auth Confirm PKCE] Error exchanging code for session:', error.message);
        return redirect(REDIRECT_ON_ERROR)
      }
      
      console.log(`[Auth Confirm PKCE] Code exchanged successfully. Checking user type...`);
      
      // Get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('[Auth Confirm PKCE] Error getting user:', userError?.message);
        return redirect(REDIRECT_ON_ERROR)
      }
      
      console.log(`[Auth Confirm PKCE] User: ${user.id}, Email: ${user.email}`);
      
      // Check if user is a Mindless Admin
      const { data: admin } = await serviceClient
        .from('admins')
        .select('id, email, name')
        .or(`supabase_user_id.eq.${user.id},email.ilike.${user.email}`)
        .eq('is_active', true)
        .maybeSingle()
      
      if (admin) {
        console.log(`[Auth Confirm PKCE] User is a Mindless Admin. Skipping onboarding.`);
        
        // Link supabase_user_id if not already linked
        if (user.id) {
          await serviceClient
            .from('admins')
            .update({ supabase_user_id: user.id })
            .eq('id', admin.id)
        }
        
        // Upsert user_profiles with admin type
        await serviceClient
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            email: user.email,
            user_type: 'admin',
            first_name: admin.name?.split(' ')[0] || null,
            last_name: admin.name?.split(' ').slice(1).join(' ') || null,
            registration_completed_at: now,
            last_login_at: now,
          }, { onConflict: 'user_id' })
        
        return redirect(REDIRECT_ADMIN)
      }
      
      // Check if user is a University user (using university_users table)
      const { data: universityUser } = await serviceClient
        .from('university_users')
        .select('id, name, university_id')
        .or(`supabase_user_id.eq.${user.id},email.ilike.${user.email}`)
        .eq('is_active', true)
        .maybeSingle()
      
      if (universityUser) {
        console.log(`[Auth Confirm PKCE] User is a University user. Skipping onboarding.`);
        
        // Check if this is the first time accepting the invite (invite_accepted_at not set)
        const { data: fullUniversityUser } = await serviceClient
          .from('university_users')
          .select('invite_accepted_at, invite_sent_at, supabase_user_id')
          .eq('id', universityUser.id)
          .single()
        
        const isFirstTimeAcceptingInvite = fullUniversityUser?.invite_sent_at && !fullUniversityUser?.invite_accepted_at
        const needsLinking = !fullUniversityUser?.supabase_user_id || fullUniversityUser.supabase_user_id !== user.id
        
        // Link supabase_user_id if not already linked, and mark invite as accepted
        if (needsLinking || isFirstTimeAcceptingInvite) {
          console.log(`[Auth Confirm PKCE] Linking supabase_user_id to university_users. User: ${user.id}, UniversityUser: ${universityUser.id}`);
          
          const { error: updateError } = await serviceClient
            .from('university_users')
            .update({ 
              supabase_user_id: user.id,
              ...(isFirstTimeAcceptingInvite ? { invite_accepted_at: now } : {}),
              last_login_at: now,
            })
            .eq('id', universityUser.id)
          
          if (updateError) {
            console.error(`[Auth Confirm PKCE] FAILED to link supabase_user_id:`, updateError.message);
          } else {
            console.log(`[Auth Confirm PKCE] Successfully linked supabase_user_id ${user.id} to university_user ${universityUser.id}`);
          }
        } else {
          // Just update last login
          await serviceClient
            .from('university_users')
            .update({ last_login_at: now })
            .eq('id', universityUser.id)
        }
        
        // Upsert user_profiles with university_user type
        const { error: profileError } = await serviceClient
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            email: user.email,
            user_type: 'university_user',
            first_name: universityUser.name?.split(' ')[0] || null,
            last_name: universityUser.name?.split(' ').slice(1).join(' ') || null,
            registration_completed_at: now,
            last_login_at: now,
          }, { onConflict: 'user_id' })
        
        if (profileError) {
          console.error(`[Auth Confirm PKCE] Failed to upsert user_profiles:`, profileError.message);
        }
        
        // If this is the first time accepting invite, redirect to password setup page
        if (isFirstTimeAcceptingInvite) {
          console.log(`[Auth Confirm PKCE] First time accepting invite. Redirecting to password setup.`);
          return redirect('/login/partners/setup')
        }
        
        return redirect(REDIRECT_UNIVERSITY)
      }
      
      // Check if user already has completed registration (user_profiles)
      const { data: existingProfile } = await serviceClient
        .from('user_profiles')
        .select('registration_completed_at, user_type')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (existingProfile?.registration_completed_at) {
        console.log(`[Auth Confirm PKCE] User has already completed registration.`);
        
        // Update last login
        await serviceClient
          .from('user_profiles')
          .update({ last_login_at: now })
          .eq('user_id', user.id)
        
        return redirect(REDIRECT_ACADEMY)
      }
      
      // Check if user is an existing learner (in learners table)
      const { data: existingLearner } = await serviceClient
        .from('learners')
        .select('id, email, first_name, last_name, invite_sent_at')
        .eq('email', user.email?.toLowerCase())
        .maybeSingle()
      
      if (existingLearner) {
        console.log(`[Auth Confirm PKCE] User is an existing learner. Linking auth account.`);
        
        // Link the supabase_user_id to the learner record.
        // Also set invite_sent_at if null — user confirmed their email and is active,
        // so the invite status is resolved regardless of whether an email was sent.
        await serviceClient
          .from('learners')
          .update({ 
            supabase_user_id: user.id,
            ...(existingLearner.invite_sent_at ? {} : { invite_sent_at: now }),
          })
          .eq('id', existingLearner.id)
        
        // Upsert user_profiles with learner type and registration complete
        await serviceClient
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            email: user.email,
            user_type: 'learner',
            first_name: existingLearner.first_name || null,
            last_name: existingLearner.last_name || null,
            registration_completed_at: now,
            last_login_at: now,
          }, { onConflict: 'user_id' })
        
        return redirect(REDIRECT_ACADEMY)
      }
      
      // Regular student - needs onboarding
      console.log(`[Auth Confirm PKCE] New user. Redirecting to onboarding.`);
      
      // Create user_profile without registration_completed_at (needs onboarding)
      await serviceClient
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          user_type: 'learner', // Default to learner for self-signup
          last_login_at: now,
        }, { onConflict: 'user_id' })
      
      return redirect(REDIRECT_ONBOARDING)
      
    } catch (e: any) {
      console.error('[Auth Confirm PKCE] Unexpected error during code exchange:', e.message);
      return redirect(REDIRECT_ON_ERROR)
    }
  }

  // Redirect to login if code is missing
  console.warn('[Auth Confirm PKCE] Code missing from request. Redirecting to login.');
  return redirect('/login?error=invalid_link_code_missing')
}
