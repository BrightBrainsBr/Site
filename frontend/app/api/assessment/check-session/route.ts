import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface CompanyContext {
  company_id: string
  department?: string
  departments: string[]
  bright_insights_enabled?: boolean
  cycle_id?: string
  code_id?: string
}

async function resolveCompanyContext(
  sb: SupabaseClient,
  user: User
): Promise<CompanyContext | null> {
  const userEmail = user.email?.toLowerCase().trim()
  if (!userEmail) {
    console.warn('[assessment/check-session] No email on auth user', user.id)
    return null
  }

  const { data: invite } = await sb
    .from('company_access_codes')
    .select('id, company_id, department, cycle_id')
    .eq('employee_email', userEmail)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (invite) {
    const { data: companyData } = await sb
      .from('companies')
      .select('departments, bright_insights_enabled')
      .eq('id', invite.company_id)
      .single()

    return {
      company_id: invite.company_id,
      department: invite.department ?? undefined,
      departments: companyData?.departments ?? [],
      bright_insights_enabled: companyData?.bright_insights_enabled ?? false,
      cycle_id: invite.cycle_id,
      code_id: invite.id,
    }
  }

  const metaCompanyId = user.user_metadata?.company_id as string | undefined
  if (metaCompanyId) {
    return await buildContextFromCompanyId(sb, metaCompanyId)
  }

  const domain = userEmail.split('@')[1]
  if (domain) {
    const { data: domainCompany } = await sb
      .from('companies')
      .select('id, departments, bright_insights_enabled')
      .contains('allowed_domains', [domain])
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (domainCompany) {
      return await buildContextFromCompanyId(
        sb,
        domainCompany.id,
        domainCompany.departments ?? [],
        domainCompany.bright_insights_enabled ?? false
      )
    }
  }

  return null
}

async function buildContextFromCompanyId(
  sb: SupabaseClient,
  companyId: string,
  departments?: string[],
  brightInsightsEnabled?: boolean
): Promise<CompanyContext> {
  let depts = departments
  let insightsFlag = brightInsightsEnabled

  if (depts === undefined || insightsFlag === undefined) {
    const { data: companyData } = await sb
      .from('companies')
      .select('departments, bright_insights_enabled')
      .eq('id', companyId)
      .single()
    depts = depts ?? companyData?.departments ?? []
    insightsFlag = insightsFlag ?? companyData?.bright_insights_enabled ?? false
  }

  const { data: currentCycle } = await sb
    .from('assessment_cycles')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_current', true)
    .maybeSingle()

  return {
    company_id: companyId,
    departments: depts ?? [],
    bright_insights_enabled: insightsFlag ?? false,
    cycle_id: currentCycle?.id ?? undefined,
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabaseUrl =
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const companyContext = await resolveCompanyContext(sb, user)

    if (!companyContext) {
      return NextResponse.json({ authenticated: true, hasInvite: false })
    }

    return NextResponse.json({
      authenticated: true,
      hasInvite: true,
      userEmail: user.email,
      companyContext,
    })
  } catch (err) {
    console.error('[assessment/check-session] Error:', err)
    return NextResponse.json({ authenticated: false })
  }
}
