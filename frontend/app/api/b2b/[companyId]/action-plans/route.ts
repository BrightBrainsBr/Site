// frontend/app/api/b2b/[companyId]/action-plans/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { ensureTracingFlushed } from '~/agents/shared/tracing'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import { buildAndInvokeActionPlanGraph } from './lib/invokeActionPlanAgent'

export const runtime = 'nodejs'
export const maxDuration = 120

const TAG = '[b2b/action-plans]'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')
  const statusFilter = searchParams.get('status')
  const departmentFilter = searchParams.get('department')

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

  let query = sb
    .from('b2b_action_plans')
    .select('*')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  if (departmentFilter) {
    query = query.eq('department', departmentFilter)
  }

  const { data: items, error } = await query

  if (error) {
    console.error(`${TAG} GET error`, error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }

  const plans = items ?? []
  const statusCounts = {
    pendente: 0,
    em_andamento: 0,
    concluido: 0,
    agendado: 0,
  }

  for (const p of plans) {
    const s = p.status as keyof typeof statusCounts
    if (s in statusCounts) statusCounts[s]++
  }

  return NextResponse.json({ items: plans, statusCounts })
}

export async function POST(
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

  const body = await request.json()

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (body.generate === true) {
    const t0 = Date.now()
    console.warn(
      `${TAG} GENERATE START company=${companyId} cycle=${cycleRes.cycleId}`
    )

    try {
      const generated = await buildAndInvokeActionPlanGraph({
        companyId,
        cycleId: cycleRes.cycleId,
        department: body.department ?? null,
      })

      console.warn(
        `${TAG} GENERATE LLM DONE plans=${generated.length} in ${Date.now() - t0}ms`
      )

      const rows = generated.map((item) => ({
        company_id: companyId,
        cycle_id: cycleRes.cycleId,
        description: item.description,
        department: item.department ?? null,
        priority: item.priority,
        status: 'pendente',
        responsible: item.responsible ?? null,
        deadline: item.deadline ?? null,
        notes: item.notes ?? null,
        ai_generated: true,
        created_by: auth.ok ? auth.userId : null,
      }))

      const { data, error } = await sb
        .from('b2b_action_plans')
        .insert(rows)
        .select()

      await ensureTracingFlushed()

      if (error) {
        console.error(`${TAG} INSERT FAILED`, error)
        return NextResponse.json(
          { error: `Erro ao salvar planos gerados: ${error.message}` },
          { status: 500 }
        )
      }

      console.warn(
        `${TAG} GENERATE COMPLETE plans=${data?.length ?? 0} total=${Date.now() - t0}ms`
      )
      return NextResponse.json({ items: data })
    } catch (err) {
      await ensureTracingFlushed()
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      console.error(
        `${TAG} GENERATE FAILED error="${message}" total=${Date.now() - t0}ms`
      )
      if (stack) console.error(`${TAG} STACK`, stack)
      return NextResponse.json(
        { error: `Falha na geração de planos: ${message}` },
        { status: 500 }
      )
    }
  }

  const { description, department, priority, responsible, deadline, notes } =
    body

  if (!description) {
    return NextResponse.json(
      { error: 'description é obrigatório' },
      { status: 400 }
    )
  }

  const { data, error } = await sb
    .from('b2b_action_plans')
    .insert({
      company_id: companyId,
      cycle_id: cycleRes.cycleId,
      description,
      department: department ?? null,
      priority: priority ?? 'media',
      status: 'pendente',
      responsible: responsible ?? null,
      deadline: deadline ?? null,
      notes: notes ?? null,
      ai_generated: false,
      created_by: auth.ok ? auth.userId : null,
    })
    .select()
    .single()

  if (error) {
    console.error(`${TAG} INSERT error`, error)
    return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
