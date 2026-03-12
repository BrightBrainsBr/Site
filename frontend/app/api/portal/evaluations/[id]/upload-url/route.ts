import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BUCKET = 'assessment-pdfs'

function createSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('portal_session')
    if (!session?.value) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { filename, contentType } = (await request.json()) as {
      filename: string
      contentType: string
    }

    if (!filename) {
      return NextResponse.json(
        { error: 'filename é obrigatório' },
        { status: 400 }
      )
    }

    const ext = filename.split('.').pop() ?? 'bin'
    const storagePath = `uploads/${id}/doctor/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`

    const sb = createSb()
    const { data, error } = await sb.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      console.error('[portal/upload-url] Signed URL error:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar URL de upload' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: storagePath,
      token: data.token,
      contentType: contentType || 'application/octet-stream',
    })
  } catch (err) {
    console.error('[portal/upload-url] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
