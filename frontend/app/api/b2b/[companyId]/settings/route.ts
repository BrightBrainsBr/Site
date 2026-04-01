// frontend/app/api/b2b/[companyId]/settings/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser } from '../../lib/getB2BUser'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: users } = await sb
    .from('company_users')
    .select('id, user_id, role, created_at')
    .eq('company_id', companyId)

  const enriched = await Promise.all(
    (users ?? []).map(async (u) => {
      const { data } = await sb.auth.admin.getUserById(u.user_id)
      return { ...u, email: data?.user?.email ?? null }
    })
  )

  const { data: company } = await sb
    .from('companies')
    .select(
      'id, name, allowed_domains, departments, nr1_process_descriptions, nr1_activities, nr1_preventive_measures, sst_responsible_name, sst_responsible_role, sst_signature_url, cnae, risk_grade, emergency_sop_urls'
    )
    .eq('id', companyId)
    .single()

  const { data: evaluations } = await sb
    .from('mental_health_evaluations')
    .select(
      'id, patient_name, patient_email, employee_department, status, reviewer_status, created_at, cycle_id'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const { data: pendingInvites } = await sb
    .from('company_access_codes')
    .select('id, employee_email, department, created_at, cycle_id, started_at')
    .eq('company_id', companyId)
    .is('used_at', null)
    .eq('active', true)
    .order('created_at', { ascending: false })

  const evaluatedEmails = new Set(
    (evaluations ?? [])
      .map((e) => {
        const email = e.patient_email
        return typeof email === 'string' ? email.toLowerCase() : null
      })
      .filter((v): v is string => v != null && v !== '')
  )
  const invitedOnly = (pendingInvites ?? []).filter((inv) => {
    const email = inv.employee_email
    if (!email || typeof email !== 'string') return true
    return !evaluatedEmails.has(email.toLowerCase())
  })

  return NextResponse.json({
    users: enriched,
    allowed_domains: company?.allowed_domains ?? [],
    departments: company?.departments ?? [],
    company_name: company?.name ?? null,
    collaborators: {
      evaluations: evaluations ?? [],
      pending_invites: invitedOnly,
    },
    nr1: {
      nr1_process_descriptions: company?.nr1_process_descriptions ?? null,
      nr1_activities: company?.nr1_activities ?? null,
      nr1_preventive_measures: company?.nr1_preventive_measures ?? null,
      sst_responsible_name: company?.sst_responsible_name ?? null,
      sst_responsible_role: company?.sst_responsible_role ?? null,
      sst_signature_url: company?.sst_signature_url ?? null,
      cnae: company?.cnae ?? null,
      risk_grade: company?.risk_grade ?? null,
      emergency_sop_urls: company?.emergency_sop_urls ?? null,
    },
  })
}

// eslint-disable-next-line complexity -- multi-action company settings POST
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })

  const body = await request.json()
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (body.action === 'invite_bulk') {
    const emails: string[] = body.emails ?? []
    const role: string = body.role ?? 'collaborator'
    const department: string | undefined = body.department
    const emailDepartments: Record<string, string> | undefined =
      body.emailDepartments

    if (!emails.length)
      return NextResponse.json({ error: 'emails required' }, { status: 400 })

    const redirectTo = `${getSiteUrl()}/pt-BR/empresa/auth-callback`
    const results: Array<{ email: string; ok: boolean; error?: string }> = []

    let currentCycleId: string | null = null
    if (role === 'collaborator') {
      const { data: cycles } = await sb
        .from('assessment_cycles')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_current', true)
        .limit(1)
      currentCycleId = cycles?.[0]?.id ?? null
      if (!currentCycleId) {
        return NextResponse.json(
          { error: 'Nenhum ciclo ativo encontrado para esta empresa' },
          { status: 400 }
        )
      }
    }

    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase()
      if (!email || !email.includes('@')) {
        results.push({ email, ok: false, error: 'invalid email' })
        continue
      }

      const effectiveDept = emailDepartments?.[email] ?? department ?? null

      try {
        if (role === 'admin') {
          const { data: inviteData, error: inviteErr } =
            await sb.auth.admin.inviteUserByEmail(email, {
              redirectTo,
              data: { needs_password_setup: true },
            })
          if (inviteErr) {
            const isAlreadyRegistered =
              inviteErr.message
                ?.toLowerCase()
                .includes('already been registered') ||
              inviteErr.message?.toLowerCase().includes('already registered')

            if (isAlreadyRegistered) {
              const { data: usersListData } = await sb.auth.admin.listUsers()
              const existingUser = usersListData?.users?.find(
                (u) => u.email?.toLowerCase() === email
              )
              if (existingUser) {
                await sb.from('company_users').upsert(
                  {
                    user_id: existingUser.id,
                    company_id: companyId,
                    role: 'viewer',
                  },
                  { onConflict: 'user_id,company_id' }
                )
                results.push({ email, ok: true })
                continue
              }
            }

            results.push({ email, ok: false, error: inviteErr.message })
            continue
          }
          const userId = inviteData.user?.id
          if (userId) {
            await sb
              .from('company_users')
              .upsert(
                { user_id: userId, company_id: companyId, role: 'viewer' },
                { onConflict: 'user_id,company_id' }
              )
          }
          results.push({ email, ok: true })
        } else {
          const { error: insertErr } = await sb
            .from('company_access_codes')
            .insert({
              company_id: companyId,
              cycle_id: currentCycleId,
              code: `INV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
              employee_email: email,
              department: effectiveDept,
              active: true,
            })
          if (insertErr) {
            results.push({ email, ok: false, error: insertErr.message })
            continue
          }
          results.push({ email, ok: true })
        }
      } catch (err) {
        results.push({
          email,
          ok: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({ results })
  }

  if (body.action === 'remove_invite') {
    const inviteId = body.inviteId
    if (!inviteId)
      return NextResponse.json({ error: 'inviteId required' }, { status: 400 })

    const { error } = await sb
      .from('company_access_codes')
      .delete()
      .eq('id', inviteId)
      .eq('company_id', companyId)
      .is('used_at', null)

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'remove_user') {
    const userId = body.userId
    if (!userId)
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === auth.userId) {
      return NextResponse.json(
        { error: 'Não é possível remover a si mesmo' },
        { status: 400 }
      )
    }

    await sb
      .from('company_users')
      .delete()
      .eq('company_id', companyId)
      .eq('user_id', userId)
    return NextResponse.json({ success: true })
  }

  if (body.action === 'update_domains') {
    const domains = body.domains
    if (!Array.isArray(domains))
      return NextResponse.json(
        { error: 'domains must be array' },
        { status: 400 }
      )

    await sb
      .from('companies')
      .update({ allowed_domains: domains })
      .eq('id', companyId)
    return NextResponse.json({ success: true })
  }

  if (body.action === 'update_departments') {
    const departments = body.departments
    if (!Array.isArray(departments))
      return NextResponse.json(
        { error: 'departments must be array' },
        { status: 400 }
      )

    await sb.from('companies').update({ departments }).eq('id', companyId)
    return NextResponse.json({ success: true })
  }

  if (body.action === 'upload_file') {
    const { bucket, fileName, contentType } = body as {
      bucket: string
      fileName: string
      contentType: string
    }
    const allowedBuckets = ['company-signatures', 'company-documents']
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }
    const filePath = `${companyId}/${Date.now()}-${fileName}`
    const { data: signedData, error: signedError } = await sb.storage
      .from(bucket)
      .createSignedUploadUrl(filePath)

    if (signedError) {
      return NextResponse.json(
        { error: signedError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      path: signedData.path,
      token: signedData.token,
      fullPath: `${filePath}`,
    })
  }

  if (body.action === 'get_public_url') {
    const { bucket, path: filePath } = body as {
      bucket: string
      path: string
    }
    const { data } = sb.storage.from(bucket).getPublicUrl(filePath)
    return NextResponse.json({ publicUrl: data.publicUrl })
  }

  if (body.action === 'update_nr1_fields') {
    const allowedFields = [
      'nr1_process_descriptions',
      'nr1_activities',
      'nr1_preventive_measures',
      'sst_responsible_name',
      'sst_responsible_role',
      'sst_signature_url',
      'cnae',
      'risk_grade',
      'emergency_sop_urls',
    ] as const

    const update: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        update[field] = body[field]
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No valid NR-1 fields provided' },
        { status: 400 }
      )
    }

    const { error: updateError } = await sb
      .from('companies')
      .update(update)
      .eq('id', companyId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
