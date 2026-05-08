// frontend/app/api/brightmonitor/[companyId]/extract-pdf/route.ts

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  extractEventsFromPdfWithGemini,
  extractNR1FieldsFromPdfWithGemini,
} from '~/agents/pdf-extraction/services/pdf-extraction.gemini'
import { ensureTracingFlushed } from '~/agents/shared/tracing'

import { getB2BUser } from '../../lib/getB2BUser'

async function fetchPdfBuffer(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith('data:')) {
    const base64 = fileUrl.split(',')[1]
    if (!base64) throw new Error('data URL inválida (sem payload base64)')
    return Buffer.from(base64, 'base64')
  }
  const res = await fetch(fileUrl)
  if (!res.ok) {
    throw new Error(`Falha ao baixar o PDF: ${res.status} ${res.statusText}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

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
  let pdfBuffer: Buffer
  let fileName = 'document.pdf'
  let extractionType: 'nr1-fields' | 'events-bulk'

  const contentType = request.headers.get('content-type') ?? ''
  try {
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

      pdfBuffer = Buffer.from(await file.arrayBuffer())
      fileName = file.name || fileName
      extractionType = rawType as 'nr1-fields' | 'events-bulk'
    } else {
      const body = await request.json()
      const { fileUrl, extractionType: t } = body as {
        fileUrl: string
        extractionType: 'nr1-fields' | 'events-bulk'
      }

      if (!fileUrl || !t) {
        return NextResponse.json(
          { error: 'fileUrl e extractionType são obrigatórios' },
          { status: 400 }
        )
      }

      pdfBuffer = await fetchPdfBuffer(fileUrl)
      extractionType = t
      try {
        const decoded = decodeURIComponent(fileUrl.split('?')[0] ?? '')
        const segs = decoded.split('/')
        fileName = segs[segs.length - 1] || fileName
      } catch {
        // ignore — fileName fallback already set
      }
    }
  } catch (err) {
    console.error('[b2b/extract-pdf] input error', err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Não foi possível ler o arquivo enviado',
      },
      { status: 400 }
    )
  }

  if (!pdfBuffer.length) {
    return NextResponse.json(
      { error: 'Arquivo PDF vazio ou inválido' },
      { status: 400 }
    )
  }

  try {
    const result =
      extractionType === 'nr1-fields'
        ? await extractNR1FieldsFromPdfWithGemini(pdfBuffer, fileName)
        : await extractEventsFromPdfWithGemini(pdfBuffer, fileName)

    await ensureTracingFlushed()

    return NextResponse.json({
      extracted: result.extracted,
      confidence: result.confidence,
      warnings: result.warnings,
    })
  } catch (err) {
    await ensureTracingFlushed()
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[b2b/extract-pdf]', msg)
    return NextResponse.json(
      {
        error: 'Falha na extração do PDF',
        detail: msg,
      },
      { status: 500 }
    )
  }
}
