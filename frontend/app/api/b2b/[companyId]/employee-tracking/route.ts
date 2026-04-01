// frontend/app/api/b2b/[companyId]/employee-tracking/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const cycleRes = await resolveCycle(companyId, cycleParam)
  if ('error' in cycleRes) {
    return NextResponse.json(
      { error: cycleRes.error },
      { status: cycleRes.status }
    )
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: codes, error } = await sb
    .from('company_access_codes')
    .select('id, employee_email, department, started_at, used_at')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  if (error) {
    console.error('[b2b/employee-tracking]', error)
    return NextResponse.json(
      { error: 'Erro ao buscar rastreamento' },
      { status: 500 }
    )
  }

  const allCodes = codes ?? []
  const total = allCodes.length
  let completed = 0
  let started = 0
  let pending = 0

  const deptMap = new Map<
    string,
    { total: number; completed: number }
  >()

  const employees: Array<{
    email: string | null
    department: string | null
    status: 'pendente' | 'iniciou' | 'completou'
    started_at: string | null
    completed_at: string | null
  }> = []

  for (const code of allCodes) {
    let status: 'pendente' | 'iniciou' | 'completou'

    if (code.used_at) {
      status = 'completou'
      completed++
    } else if (code.started_at) {
      status = 'iniciou'
      started++
    } else {
      status = 'pendente'
      pending++
    }

    employees.push({
      email: code.employee_email,
      department: code.department,
      status,
      started_at: code.started_at ?? null,
      completed_at: code.used_at ?? null,
    })

    const dept = code.department ?? 'Sem departamento'
    const entry = deptMap.get(dept) ?? { total: 0, completed: 0 }
    entry.total++
    if (status === 'completou') entry.completed++
    deptMap.set(dept, entry)
  }

  const byDepartment = Array.from(deptMap.entries()).map(([name, d]) => ({
    name,
    total: d.total,
    completed: d.completed,
    pct: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
  }))

  const completionPct =
    total > 0 ? Math.round((completed / total) * 100) : 0

  return NextResponse.json({
    total,
    completed,
    started,
    pending,
    completionPct,
    byDepartment,
    employees,
    cycleId: cycleRes.cycleId,
  })
}
