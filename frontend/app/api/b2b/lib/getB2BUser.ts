import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { createClient as createServerClient } from '~/utils/supabase/server'

export async function getB2BUser(
  request: NextRequest,
  companyId: string
): Promise<
  | {
      ok: true
      companyId: string
      userId: string
      /** Set when the caller is portal code–authenticated (not a Supabase auth user UUID). */
      isPortalAdmin?: boolean
    }
  | { ok: false; status: number; body: object }
> {
  const cookieStore = await cookies()
  const portalSession = cookieStore.get('portal_session')
  if (portalSession?.value) {
    return {
      ok: true,
      companyId,
      userId: 'portal-admin',
      isPortalAdmin: true,
    }
  }

  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!userError && user) {
      const sb = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: cu, error: cuError } = await sb
        .from('company_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .maybeSingle()

      if (!cuError && cu) {
        return { ok: true, companyId, userId: user.id, isPortalAdmin: false }
      }
    }
  } catch {
    // Supabase cookie parsing can fail (e.g. Base64-URL errors) — not fatal
  }

  return { ok: false, status: 401, body: { error: 'Unauthorized' } }
}

export async function resolveCycle(
  companyId: string,
  cycleParam: string | null
): Promise<{ cycleId: string } | { error: string; status: number }> {
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (cycleParam) {
    const { data: cycle } = await sb
      .from('assessment_cycles')
      .select('id')
      .eq('id', cycleParam)
      .eq('company_id', companyId)
      .maybeSingle()
    if (cycle) return { cycleId: cycle.id }
    return { error: 'Cycle not found', status: 404 }
  }

  const { data: current } = await sb
    .from('assessment_cycles')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_current', true)
    .maybeSingle()

  if (!current) return { error: 'No current cycle', status: 404 }
  return { cycleId: current.id }
}
