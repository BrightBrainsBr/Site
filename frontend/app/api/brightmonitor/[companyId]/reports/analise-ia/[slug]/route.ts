// frontend/app/api/brightmonitor/[companyId]/reports/analise-ia/[slug]/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { ANALISE_IA_SLUGS } from '~/features/assessment/components/constants/nr1-options'

import { getB2BUser, resolveCycle } from '../../../../lib/getB2BUser'
import {
  getAnaliseCriticosPrompt,
  getAnaliseGeralPrompt,
  getAnalisePriorizarPrompt,
  getAnalisePsicossocialPrompt,
} from '../../lib/analise-prompts'
import { buildPGRContext } from '../../lib/build-context'
import { invokeBrightMonitorMarkdown } from '../../lib/invoke-report-llm'

export const runtime = 'nodejs'
export const maxDuration = 120

type AnaliseSlug = (typeof ANALISE_IA_SLUGS)[number]

const PROMPT_MAP: Record<AnaliseSlug, typeof getAnaliseGeralPrompt> = {
  geral: getAnaliseGeralPrompt,
  psicossocial: getAnalisePsicossocialPrompt,
  criticos: getAnaliseCriticosPrompt,
  priorizar: getAnalisePriorizarPrompt,
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; slug: string }> }
) {
  const { companyId, slug } = await params

  if (!ANALISE_IA_SLUGS.includes(slug as AnaliseSlug)) {
    return NextResponse.json(
      {
        error: `Slug inválido. Valores aceitos: ${ANALISE_IA_SLUGS.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')

  const cycleRes = await resolveCycle(companyId, cycleParam)
  if ('error' in cycleRes) {
    return NextResponse.json(
      { error: cycleRes.error },
      { status: cycleRes.status }
    )
  }

  try {
    const ctx = await buildPGRContext(companyId, cycleRes.cycleId)
    const promptFn = PROMPT_MAP[slug as AnaliseSlug]
    const { system, user } = promptFn(ctx)

    const markdown = await invokeBrightMonitorMarkdown({
      system,
      user,
      task: 'general_response',
      stepName: 'brightmonitor_analise_ia',
    })

    return NextResponse.json({ markdown })
  } catch (error) {
    console.error('[analise-ia/generate]', error)
    return NextResponse.json(
      { error: 'Erro ao gerar análise' },
      { status: 500 }
    )
  }
}
