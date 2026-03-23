import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ authenticated: false })
    }

    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: invite } = await sb
      .from('company_access_codes')
      .select('id, company_id, department, cycle_id')
      .eq('employee_email', user.email!)
      .is('used_at', null)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!invite) {
      return NextResponse.json({ authenticated: true, hasInvite: false })
    }

    const { data: companyData } = await sb
      .from('companies')
      .select('departments')
      .eq('id', invite.company_id)
      .single()

    return NextResponse.json({
      authenticated: true,
      hasInvite: true,
      userEmail: user.email,
      companyContext: {
        company_id: invite.company_id,
        department: invite.department ?? undefined,
        departments: companyData?.departments ?? [],
        cycle_id: invite.cycle_id,
        code_id: invite.id,
      },
    })
  } catch (err) {
    console.error('[assessment/check-session] Error:', err)
    return NextResponse.json({ authenticated: false })
  }
}
