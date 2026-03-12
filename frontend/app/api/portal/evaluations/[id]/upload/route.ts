import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BUCKET = 'assessment-pdfs'
const MAX_FILE_SIZE = 250 * 1024 * 1024

interface DoctorUploadEntry {
  name: string
  url: string
  type: string
  path: string
  uploaded_at: string
}

async function requirePortalSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('portal_session')
  return session?.value ?? null
}

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
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const formPayload = await request.formData()
    const file = formPayload.get('file') as File | null

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

    const sb = createSb()

    const ext = file.name.split('.').pop() ?? 'bin'
    const storagePath = `uploads/${id}/doctor/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[portal/upload] Storage error:', uploadError)
      return NextResponse.json({ error: 'Erro no upload' }, { status: 500 })
    }

    const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(storagePath)

    const newEntry: DoctorUploadEntry = {
      name: file.name,
      url: urlData.publicUrl,
      type: file.type,
      path: storagePath,
      uploaded_at: new Date().toISOString(),
    }

    const { error: rpcErr } = await sb.rpc('append_doctor_upload', {
      eval_id: id,
      new_entry: newEntry,
    })

    if (rpcErr) {
      console.error('[portal/upload] Atomic append error:', rpcErr)
      await sb.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json(
        { error: 'Erro ao salvar documento' },
        { status: 500 }
      )
    }

    return NextResponse.json(newEntry)
  } catch (err) {
    console.error('[portal/upload] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as { path: string }

    if (!body.path) {
      return NextResponse.json({ error: 'path é obrigatório' }, { status: 400 })
    }

    const sb = createSb()

    const { data: row, error: fetchErr } = await sb
      .from('mental_health_evaluations')
      .select('doctor_uploads')
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const existing = (row.doctor_uploads ?? []) as DoctorUploadEntry[]
    const updated = existing.filter((d) => d.path !== body.path)

    await sb.storage.from(BUCKET).remove([body.path])

    const { error: updateErr } = await sb
      .from('mental_health_evaluations')
      .update({ doctor_uploads: updated })
      .eq('id', id)

    if (updateErr) {
      console.error('[portal/upload] DB update error:', updateErr)
      return NextResponse.json(
        { error: 'Erro ao remover documento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[portal/upload] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
