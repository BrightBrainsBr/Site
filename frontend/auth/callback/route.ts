// app/auth/callback/route.ts
// Updated to use learners/admins/university_users tables (NOT user_profiles)
import { NextRequest, NextResponse } from 'next/server';

import { createClient, createServiceClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const intendedRedirect = requestUrl.searchParams.get('redirectedFrom');

  if (!code) {
    console.error("[Auth Callback] No code found in request URL.");
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'missing_auth_code');
    return NextResponse.redirect(redirectUrl);
  }

  // Handle password recovery flow
  if (type === 'recovery') {
    console.log("[Auth Callback] Password recovery flow detected.");
    const supabase = await createClient();
    
    try {
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error("[Auth Callback] Error exchanging recovery code:", sessionError.message);
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('error', 'invalid_link_code_missing');
        return NextResponse.redirect(redirectUrl);
      }
      
      console.log("[Auth Callback] Recovery session established, redirecting to update password page.");
      return NextResponse.redirect(new URL('/auth/update-password', request.url));
    } catch (error) {
      console.error("[Auth Callback] Recovery flow error:", error);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'recovery_failed');
      return NextResponse.redirect(redirectUrl);
    }
  }

  console.log("[Auth Callback] Received code, attempting to exchange for session.");
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  try {
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("[Auth Callback] Error exchanging code for session:", sessionError.message);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'session_exchange_failed');
      redirectUrl.searchParams.set('details', sessionError.message);
      return NextResponse.redirect(redirectUrl);
    }

    console.log("[Auth Callback] Session exchanged successfully. Fetching user.");
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[Auth Callback] Error getting user after session exchange:", userError?.message || 'No user object returned.');
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'user_fetch_failed');
      return NextResponse.redirect(redirectUrl);
    }

    console.log(`[Auth Callback] User ${user.id} (${user.email}) fetched. Determining user type...`);

    // Check user roles in parallel: admin > university_user > learner
    const [adminResult, universityUserResult, learnerResult] = await Promise.all([
      serviceClient
        .from('admins')
        .select('id, email')
        .or(`supabase_user_id.eq.${user.id},email.ilike.${user.email}`)
        .eq('is_active', true)
        .maybeSingle(),
      serviceClient
        .from('university_users')
        .select('id, email')
        .or(`supabase_user_id.eq.${user.id},email.ilike.${user.email}`)
        .eq('is_active', true)
        .maybeSingle(),
      serviceClient
        .from('learners')
        .select('id, email, registration_completed_at, supabase_user_id')
        .or(`supabase_user_id.eq.${user.id},email.ilike.${user.email}`)
        .maybeSingle(),
    ]);

    // Check if user is a Mindless Admin
    if (adminResult.data) {
      console.log(`[Auth Callback] User is a Mindless Admin. Skipping onboarding.`);
      
      // Link supabase_user_id if not already linked
      if (!adminResult.data.id) {
        await serviceClient
          .from('admins')
          .update({ supabase_user_id: user.id })
          .eq('id', adminResult.data.id);
      }

      const finalRedirectPath = intendedRedirect || '/admin/cohorts';
      return NextResponse.redirect(new URL(finalRedirectPath, request.url));
    }

    // Check if user is a University user
    if (universityUserResult.data) {
      console.log(`[Auth Callback] User is a University user. Skipping onboarding.`);
      
      // Link supabase_user_id if not already linked
      await serviceClient
        .from('university_users')
        .update({ supabase_user_id: user.id })
        .eq('id', universityUserResult.data.id);

      const finalRedirectPath = intendedRedirect || '/university';
      return NextResponse.redirect(new URL(finalRedirectPath, request.url));
    }

    // Check if user is an existing learner
    if (learnerResult.data) {
      const learner = learnerResult.data;
      console.log(`[Auth Callback] User is an existing learner. Registration complete: ${!!learner.registration_completed_at}`);
      
      // Link the supabase_user_id to the learner record if not already linked
      if (!learner.supabase_user_id) {
        await serviceClient
          .from('learners')
          .update({ supabase_user_id: user.id })
          .eq('id', learner.id);
      }

      if (learner.registration_completed_at) {
        // Learner has completed registration - go to academy
        const finalRedirectPath = intendedRedirect || '/academy';
        return NextResponse.redirect(new URL(finalRedirectPath, request.url));
      } else {
        // Learner needs to complete registration
        console.log(`[Auth Callback] Learner needs to complete registration.`);
        return NextResponse.redirect(new URL('/complete-registration', request.url));
      }
    }

    // New user not in any table - likely self-signup
    // They need to go through onboarding/registration to create a learner record
    console.log(`[Auth Callback] New user (not in admins, university_users, or learners). Redirecting to complete registration.`);
    const finalRedirectPath = '/complete-registration';
    return NextResponse.redirect(new URL(finalRedirectPath, request.url));

  } catch (error) {
    console.error("[Auth Callback] Unexpected error in try-catch block:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during authentication callback';
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'callback_error');
    redirectUrl.searchParams.set('details', errorMessage);
    return NextResponse.redirect(redirectUrl);
  }
}
