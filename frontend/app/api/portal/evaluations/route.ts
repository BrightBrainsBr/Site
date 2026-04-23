// frontend/app/api/portal/evaluations/route.ts

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type {
  SortOption,
} from '~/features/portal/portal.interface'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('portal_session')

    if (!session?.value) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const profile = searchParams.get('profile') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const sort = (searchParams.get('sort') ?? 'date_desc') as SortOption

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = sb
      .from('mental_health_evaluations')
      .select(
        'id, patient_name, patient_profile, patient_email, created_at, status, reviewer_status, report_pdf_url, scores'
      )

    if (status) {
      query = query.eq('reviewer_status', status)
    }
    if (profile) {
      query = query.eq('patient_profile', profile)
    }
    if (search) {
      query = query.ilike('patient_name', `%${search}%`)
    }

    if (sort === 'date_asc') {
      query = query.order('created_at', { ascending: true })
    } else if (sort === 'name_asc') {
      query = query.order('patient_name', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('[portal/evaluations] Supabase error:', error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[portal/evaluations] Error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
