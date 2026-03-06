import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formData, scores } = body as {
      formData: Record<string, unknown>
      scores: Record<string, number>
    }

    const nome = formData?.nome as string | undefined
    if (!nome) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: row, error } = await sb
      .from('mental_health_evaluations')
      .insert({
        patient_name: nome,
        patient_email: (formData.email as string) || null,
        patient_cpf: (formData.cpf as string)?.replace(/\D/g, '') || null,
        patient_phone: (formData.telefone as string) || null,
        patient_birth_date: (formData.nascimento as string) || null,
        patient_sex: (formData.sexo as string) || null,
        patient_profile: (formData.publico as string) || null,
        form_data: formData,
        scores,
        status: 'completed',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error('Erro ao salvar avaliação')
    }

    return NextResponse.json({ evaluationId: row.id })
  } catch (err) {
    console.error('Submit error:', err)
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
