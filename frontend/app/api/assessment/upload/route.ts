import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const BUCKET = 'assessment-pdfs'
const MAX_FILE_SIZE = 250 * 1024 * 1024

function createSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * GET — returns a signed upload URL so the client can PUT the file
 * directly to Supabase Storage, bypassing the Vercel 4.5 MB body limit.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')
    const fileSize = Number(searchParams.get('fileSize') || '0')
    const contentType = searchParams.get('contentType') || 'application/pdf'

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName é obrigatório' },
        { status: 400 }
      )
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máx 250MB)' },
        { status: 400 }
      )
    }

    const ext = fileName.split('.').pop() ?? 'bin'
    const path = `uploads/pending/${crypto.randomUUID()}/${Date.now()}.${ext}`

    const supabase = createSupabase()

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error) {
      console.error('Signed URL error:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar URL de upload' },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl,
      contentType,
    })
  } catch (err) {
    console.error('Upload URL route error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST — legacy proxy upload kept for small files / backwards compat.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabase()

    const formPayload = await request.formData()
    const file = formPayload.get('file') as File | null
    const evaluationId = formPayload.get('evaluationId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máx 250MB)' },
        { status: 400 }
      )
    }

    const folder = evaluationId ?? `pending/${crypto.randomUUID()}`
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `uploads/${folder}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      url: urlData.publicUrl,
      path,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
