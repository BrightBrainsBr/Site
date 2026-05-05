// frontend/app/api/brightmonitor/[companyId]/extract-pdf/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createPdfExtractionGraph } from '~/agents/pdf-extraction/services/pdf-extraction.graph'
import { ensureTracingFlushed } from '~/agents/shared/tracing'

import { getB2BUser } from '../../lib/getB2BUser'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  // Accept both FormData (file upload) and JSON (URL-based)
  let fileUrl: string
  let extractionType: 'nr1-fields' | 'events-bulk'

  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const rawType = formData.get('extractionType') as string | null

    if (!file || !rawType) {
      return NextResponse.json(
        { error: 'file e extractionType são obrigatórios' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    fileUrl = `data:application/pdf;base64,${buffer.toString('base64')}`
    extractionType = rawType as 'nr1-fields' | 'events-bulk'
  } else {
    const body = await request.json()
    ;({ fileUrl, extractionType } = body as {
      fileUrl: string
      extractionType: 'nr1-fields' | 'events-bulk'
    })

    if (!fileUrl || !extractionType) {
      return NextResponse.json(
        { error: 'fileUrl e extractionType são obrigatórios' },
        { status: 400 }
      )
    }
  }

  try {
    const graph = createPdfExtractionGraph()

    const result = await graph.invoke({
      fileUrl,
      extractionType,
      rawText: '',
      extracted: null,
      confidence: 0,
      warnings: [],
      status: 'pending',
      errors: [],
    })

    await ensureTracingFlushed()

    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.errors.join('; '), warnings: result.warnings },
        { status: 422 }
      )
    }

    return NextResponse.json({
      extracted: result.extracted,
      confidence: result.confidence,
      warnings: result.warnings,
    })
  } catch (err) {
    await ensureTracingFlushed()
    console.error('[b2b/extract-pdf]', err)
    return NextResponse.json(
      { error: 'Falha na extração do PDF' },
      { status: 500 }
    )
  }
}
