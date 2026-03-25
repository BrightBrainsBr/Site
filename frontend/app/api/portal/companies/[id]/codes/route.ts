// frontend/app/api/portal/companies/[id]/codes/route.ts

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { validatePortalSession } from '../../../lib/validatePortalSession'

export const runtime = 'nodejs'

const CANONICAL_PROD_URL = 'https://www.brightbrains.com.br'

function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined) ??
    'http://localhost:3000'

  if (raw.includes('brightbrains.com')) return CANONICAL_PROD_URL
  return raw
}

function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: companyId } = await params
  const body = (await request.json()) as {
    department?: string
    count?: number
    employee_emails?: string[]
  }

  const department = body.department?.trim() ?? ''
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 100)
  const employeeEmails = body.employee_emails ?? []

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: currentCycle } = await sb
    .from('assessment_cycles')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_current', true)
    .maybeSingle()

  if (!currentCycle) {
    return NextResponse.json(
      { message: 'No current cycle for company' },
      { status: 400 }
    )
  }

  const codes: Array<{
    id: string
    code: string
    department: string
    employee_email: string | null
    shareable_url: string
  }> = []
  const usedCodes = new Set<string>()

  const { data: existing } = await sb
    .from('company_access_codes')
    .select('code')
  for (const row of existing ?? []) {
    usedCodes.add((row as { code: string }).code)
  }

  const toInsert: Array<{
    company_id: string
    cycle_id: string
    code: string
    department: string
    employee_email: string | null
    active: boolean
  }> = []

  for (let i = 0; i < count; i++) {
    let code: string
    do {
      code = generateCode()
    } while (usedCodes.has(code))
    usedCodes.add(code)

    const employeeEmail = employeeEmails[i]?.trim() || null

    toInsert.push({
      company_id: companyId,
      cycle_id: currentCycle.id,
      code,
      department,
      employee_email: employeeEmail,
      active: true,
    })
  }

  const { data: inserted, error } = await sb
    .from('company_access_codes')
    .insert(toInsert)
    .select('id, code, department, employee_email')

  if (error) {
    console.error('[portal/codes POST]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const baseUrl = `${getSiteUrl()}/pt-BR/avaliacao`
  for (const row of inserted ?? []) {
    const r = row as {
      id: string
      code: string
      department: string
      employee_email: string | null
    }
    codes.push({
      id: r.id,
      code: r.code,
      department: r.department,
      employee_email: r.employee_email,
      shareable_url: `${baseUrl}?c=${r.code}`,
    })
  }

  return NextResponse.json({ codes })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const valid = await validatePortalSession()
  if (!valid) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: companyId } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')
  const cycleId = searchParams.get('cycle')

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = sb
    .from('company_access_codes')
    .select(
      'id, code, department, employee_email, started_at, used_at, created_at'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (cycleId) {
    query = query.eq('cycle_id', cycleId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[portal/codes GET]', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const baseUrl = `${getSiteUrl()}/pt-BR/avaliacao`
  const safeStr = (v: unknown): string => {
    if (v == null) return ''
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    )
      return String(v)
    return ''
  }
  const rows = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    shareable_url: `${baseUrl}?c=${safeStr(r.code)}`,
  }))

  if (format === 'csv') {
    const header =
      'code,department,employee_email,shareable_url,started_at,used_at\n'
    const lines = rows.map((r: Record<string, unknown>) => {
      const code = safeStr(r.code)
      const department = safeStr(r.department)
      const employeeEmail = safeStr(r.employee_email)
      const shareableUrl = safeStr(r.shareable_url)
      const startedAt = safeStr(r.started_at)
      const usedAt = safeStr(r.used_at)
      return `${code},${department},${employeeEmail},${shareableUrl},${startedAt},${usedAt}`
    })
    const csv = header + lines.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="codes-${companyId}.csv"`,
      },
    })
  }

  return NextResponse.json({ codes: rows })
}
