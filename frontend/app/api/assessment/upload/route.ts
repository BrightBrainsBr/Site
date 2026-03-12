import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const BUCKET = 'assessment-pdfs'
const MAX_FILE_SIZE = 250 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
