// frontend/app/api/b2b/[companyId]/extract-pdf/jobs/[jobId]/process/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { processExtractionJob } from './processJob'

export const runtime = 'nodejs'
export const maxDuration = 300

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? 'pdf-jobs-internal'

/**
 * POST — Manual trigger endpoint (kept as fallback).
 * Primary path is direct invocation via after() in the jobs route.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; jobId: string }> }
) {
  const { companyId, jobId } = await params

  const secret = request.headers.get('x-internal-secret')
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await processExtractionJob(companyId, jobId)
  return NextResponse.json({ status: 'ok' })
}
