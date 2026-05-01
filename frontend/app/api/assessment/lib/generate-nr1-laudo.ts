// frontend/app/api/assessment/lib/generate-nr1-laudo.ts
//
// Generates the individual NR-1 employee laudo: a short AI-written analysis
// + scores grid + LGPD/PGR framing, exported as a clean A4 PDF and uploaded
// to the assessment-pdfs bucket. Reuses the same row.laudo_pdf_url contract
// the SummaryStep polls for.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'

import {
  getAnthropicConfigForTask,
  llmService,
  toLangChainMessages,
} from '~/shared/utils/llm'

const BUCKET = 'assessment-pdfs'

interface NR1LaudoInput {
  evaluationId: string
}

interface NR1ScoreCard {
  label: string
  value: number | null
  maxValue: number
}

type RiskBand = 'baixo' | 'moderado' | 'elevado' | 'critico'

const RISK_BANDS: Record<RiskBand, { label: string; rgb: [number, number, number] }> = {
  baixo: { label: 'Baixo', rgb: [22, 163, 74] },
  moderado: { label: 'Moderado', rgb: [161, 107, 10] },
  elevado: { label: 'Elevado', rgb: [194, 65, 12] },
  critico: { label: 'Crítico', rgb: [185, 28, 28] },
}

function classifyScore(value: number | null): RiskBand {
  if (value == null) return 'baixo'
  if (value <= 2) return 'baixo'
  if (value <= 3) return 'moderado'
  if (value <= 4) return 'elevado'
  return 'critico'
}

function createSb(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const NR1_SYSTEM_PROMPT = `Você é um especialista em saúde ocupacional e NR-1 (Norma Regulamentadora nº 1, Portaria MTE 765/2025).

Sua tarefa é redigir uma breve análise individual personalizada para um colaborador que acabou de preencher uma avaliação de riscos ocupacionais.

REGRAS:
- Fale DIRETAMENTE com o colaborador, em segunda pessoa ("você"), tom profissional, empático e prático.
- NÃO faça diagnóstico clínico. Esta é uma triagem ocupacional.
- NÃO inclua códigos CID, diagnósticos médicos ou medicamentos.
- Use português brasileiro claro, sem jargão excessivo.
- Limite-se a ~400 palavras no total.

FORMATO DE SAÍDA (markdown simples, exatamente nesta ordem):

## Resumo do seu perfil de risco
1 parágrafo curto: panorama geral dos seus scores e o que eles dizem sobre o seu ambiente de trabalho atual.

## Pontos de atenção
1 parágrafo destacando os 1-3 domínios de maior risco identificados (físico, ergonômico, psicossocial, violência/assédio) e por quê.

## Recomendações práticas para você
1 parágrafo com 2-4 ações concretas que você mesmo pode adotar no dia a dia.

## Observação NR-1 (Psicossociais)
1 parágrafo lembrando que, a partir de 2025, a NR-1 obriga as empresas a gerenciar riscos psicossociais — e como suas respostas contribuem para o PGR (Programa de Gerenciamento de Riscos) da empresa.`

interface FormDataNR1 {
  nome?: string
  email?: string
  nr1_role?: string
  department?: string
  nr1_work_time?: string
  biggest_risk?: string
  satisfaction_level?: number
  had_accident?: boolean
}

function buildUserPrompt(
  fd: FormDataNR1,
  scores: NR1ScoreCard[]
): string {
  const scoreLines = scores
    .map(
      (s) =>
        `- ${s.label}: ${s.value != null ? s.value.toFixed(1) : 'N/A'} / ${s.maxValue} (${RISK_BANDS[classifyScore(s.value)].label})`
    )
    .join('\n')

  return `Dados do colaborador:
- Cargo: ${fd.nr1_role ?? 'Não informado'}
- Setor: ${fd.department ?? 'Não informado'}
- Tempo na empresa: ${fd.nr1_work_time ?? 'Não informado'}

Scores (escala 1-5, onde 1 = baixo risco e 5 = alto risco):
${scoreLines}

Maior risco percebido pelo colaborador: ${fd.biggest_risk?.trim() || 'não informado'}
Satisfação geral declarada: ${fd.satisfaction_level ?? 'não informada'} (1-5)
Houve acidente nos últimos 12 meses: ${fd.had_accident ? 'Sim' : 'Não'}

Gere a análise individual conforme o formato pedido.`
}

// ---------------------------------------------------------------------------
// PDF builder
// ---------------------------------------------------------------------------

const PW = 210
const PH = 297
const MX = 18
const CW = PW - MX * 2
const NAVY: [number, number, number] = [10, 25, 47]
const LIME: [number, number, number] = [197, 225, 85]
const TXT_H: [number, number, number] = [10, 25, 47]
const TXT_B: [number, number, number] = [40, 55, 75]
const TXT_L: [number, number, number] = [100, 120, 145]
const TXT_M: [number, number, number] = [148, 163, 184]
const SOFT: [number, number, number] = [242, 246, 252]
const RULE: [number, number, number] = [205, 215, 228]

function setFill(doc: jsPDF, c: [number, number, number]): void {
  doc.setFillColor(c[0], c[1], c[2])
}
function setText(doc: jsPDF, c: [number, number, number]): void {
  doc.setTextColor(c[0], c[1], c[2])
}
function setDraw(doc: jsPDF, c: [number, number, number]): void {
  doc.setDrawColor(c[0], c[1], c[2])
}

function laudoId(evalId: string): string {
  const yr = new Date().getFullYear()
  const h = evalId.replace(/-/g, '').substring(0, 8).toUpperCase()
  return `BM-NR1-${yr}-${h}`
}

function drawHeader(doc: jsPDF, evalId: string, today: string): void {
  setFill(doc, NAVY)
  doc.rect(0, 0, PW, 23, 'F')

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  setText(doc, LIME)
  doc.text('BRIGHTMONITOR', MX, 11)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  setText(doc, TXT_M)
  doc.text('Avaliação Individual NR-1', MX, 17)

  doc.setFontSize(5.5)
  setText(doc, TXT_M)
  doc.text('ID DO LAUDO', PW - MX, 7, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(laudoId(evalId), PW - MX, 12, { align: 'right' })
  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'normal')
  setText(doc, TXT_M)
  doc.text(`Emissão: ${today}`, PW - MX, 17, { align: 'right' })

  setFill(doc, LIME)
  doc.rect(0, 23, PW, 1.5, 'F')
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  setFill(doc, LIME)
  doc.rect(0, PH - 12, PW, 0.6, 'F')
  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'normal')
  setText(doc, TXT_L)
  doc.text(
    `© ${new Date().getFullYear()} Bright Brains · BrightMonitor NR-1 · Documento gerado eletronicamente`,
    MX,
    PH - 5
  )
  setText(doc, TXT_B)
  doc.text(`Página ${pageNum} de ${totalPages}`, PW - MX, PH - 5, {
    align: 'right',
  })
}

function infoRow(
  doc: jsPDF,
  pairs: { label: string; value: string }[],
  startY: number
): number {
  const rowH = 11
  const halfW = CW / 2
  let y = startY
  for (let i = 0; i < pairs.length; i += 2) {
    setFill(doc, SOFT)
    doc.rect(MX, y, CW, rowH, 'F')
    setDraw(doc, RULE)
    doc.setLineWidth(0.25)
    doc.rect(MX, y, CW, rowH, 'S')
    doc.line(MX + halfW, y, MX + halfW, y + rowH)

    const left = pairs[i]
    const right = pairs[i + 1]
    if (left) {
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      setText(doc, TXT_L)
      doc.text(left.label.toUpperCase(), MX + 3, y + 4)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      setText(doc, TXT_B)
      doc.text(left.value || '—', MX + 3, y + 9)
    }
    if (right) {
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      setText(doc, TXT_L)
      doc.text(right.label.toUpperCase(), MX + halfW + 3, y + 4)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      setText(doc, TXT_B)
      doc.text(right.value || '—', MX + halfW + 3, y + 9)
    }
    y += rowH
  }
  return y + 4
}

function drawScoresGrid(
  doc: jsPDF,
  scores: NR1ScoreCard[],
  startY: number
): number {
  const cols = 4
  const gap = 4
  const cardW = (CW - gap * (cols - 1)) / cols
  const cardH = 28
  let y = startY
  let col = 0

  for (const s of scores) {
    const x = MX + col * (cardW + gap)
    const band = classifyScore(s.value)
    const tone = RISK_BANDS[band]

    setFill(doc, [255, 255, 255])
    doc.rect(x, y, cardW, cardH, 'F')
    setDraw(doc, RULE)
    doc.setLineWidth(0.3)
    doc.rect(x, y, cardW, cardH, 'S')

    setFill(doc, tone.rgb)
    doc.rect(x, y, 3, cardH, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    setText(doc, TXT_L)
    doc.text(s.label, x + 6, y + 6)

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    setText(doc, TXT_H)
    const display = s.value != null ? s.value.toFixed(1) : '—'
    doc.text(display, x + 6, y + 18)

    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    setText(doc, TXT_M)
    doc.text(`/ ${s.maxValue}`, x + 6 + doc.getTextWidth(display) + 2, y + 18)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    setText(doc, tone.rgb)
    doc.text(tone.label.toUpperCase(), x + 6, y + 25)

    col++
    if (col >= cols) {
      col = 0
      y += cardH + gap
    }
  }
  if (col !== 0) y += cardH + gap
  return y + 2
}

function sectionHead(doc: jsPDF, title: string, y: number): number {
  setFill(doc, SOFT)
  doc.rect(MX - 2, y - 4, CW + 4, 11, 'F')
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setText(doc, TXT_H)
  doc.text(title, MX + 2, y + 4)
  setFill(doc, LIME)
  doc.rect(MX, y + 8, CW, 1, 'F')
  return y + 13
}

function bodyText(
  doc: jsPDF,
  content: string,
  startY: number,
  ensure: (cy: number, need: number) => number
): number {
  let y = startY
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line) {
      y += 3
      continue
    }
    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '').replace(/\*\*/g, '')
      y = ensure(y, 14)
      y += 3
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      setText(doc, TXT_H)
      setFill(doc, LIME)
      doc.rect(MX, y - 1, 3, 7, 'F')
      doc.text(heading, MX + 6, y + 4)
      y += 9
      continue
    }
    if (line.startsWith('# ')) continue
    const plain = line.replace(/\*\*/g, '')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setText(doc, TXT_B)
    const wrapped = doc.splitTextToSize(plain, CW) as string[]
    for (const wl of wrapped) {
      y = ensure(y, 6)
      doc.text(wl, MX, y)
      y += 5
    }
    y += 2
  }
  return y
}

function buildPdfBuffer(args: {
  evaluationId: string
  formData: FormDataNR1
  scores: NR1ScoreCard[]
  aiText: string
  companyName: string | null
}): Buffer {
  const { evaluationId, formData, scores, aiText, companyName } = args
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const today = new Date().toLocaleDateString('pt-BR')

  drawHeader(doc, evaluationId, today)
  let y = 30

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  setText(doc, TXT_H)
  doc.text('Avaliação Individual de Riscos Ocupacionais', PW / 2, y, {
    align: 'center',
  })
  y += 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setText(doc, TXT_L)
  doc.text(
    'Conforme NR-1 · Portaria MTE 765/2025 · Programa de Gerenciamento de Riscos (PGR)',
    PW / 2,
    y,
    { align: 'center' }
  )
  y += 8

  // Identification
  y = sectionHead(doc, 'Identificação', y)
  y = infoRow(
    doc,
    [
      { label: 'Nome', value: formData.nome ?? '—' },
      { label: 'E-mail', value: formData.email ?? '—' },
      { label: 'Cargo / Função', value: formData.nr1_role ?? '—' },
      { label: 'Setor / Departamento', value: formData.department ?? '—' },
      { label: 'Tempo na empresa', value: formData.nr1_work_time ?? '—' },
      { label: 'Empresa', value: companyName ?? '—' },
    ],
    y
  )

  // Scores grid
  y += 2
  y = sectionHead(doc, 'Seus scores de risco', y)
  y = drawScoresGrid(doc, scores, y)

  // AI analysis
  y += 2
  y = sectionHead(doc, 'Análise Personalizada', y)

  const ensure = (cy: number, need: number): number => {
    if (cy + need > PH - 18) {
      drawFooter(doc, doc.getNumberOfPages(), 0) // total fixed below
      doc.addPage()
      drawHeader(doc, evaluationId, today)
      return 30
    }
    return cy
  }
  y = bodyText(doc, aiText, y, ensure)

  // LGPD note
  y = ensure(y + 4, 22)
  setFill(doc, NAVY)
  doc.rect(MX, y, CW, 18, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setText(doc, LIME)
  doc.text('DOCUMENTO CONFIDENCIAL · LGPD', MX + 4, y + 5)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  setText(doc, TXT_M)
  const lgpdNote =
    'Este laudo individual foi gerado automaticamente para uso pessoal do colaborador. Os dados enviados ao RH/SST da empresa são agregados e anonimizados, conforme LGPD (Lei 13.709/2018) e diretrizes do PGR (NR-1).'
  let ly = y + 9
  for (const l of doc.splitTextToSize(lgpdNote, CW - 8) as string[]) {
    doc.text(l, MX + 4, ly)
    ly += 3
  }

  // Footers (page count)
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    drawFooter(doc, p, totalPages)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

// ---------------------------------------------------------------------------
// Public entrypoint
// ---------------------------------------------------------------------------

export async function generateNR1IndividualLaudo({
  evaluationId,
}: NR1LaudoInput): Promise<{ pdfUrl: string }> {
  const sb = createSb()

  const { data: rowRaw, error: fetchErr } = await sb
    .from('mental_health_evaluations')
    .select(
      'company_id, form_data, patient_name, patient_email, ' +
        'score_physical, score_ergonomic, score_psychosocial, score_violence, score_overall'
    )
    .eq('id', evaluationId)
    .single()

  if (fetchErr || !rowRaw) {
    throw new Error(
      `[nr1-laudo] Evaluation ${evaluationId} not found: ${fetchErr?.message ?? 'unknown'}`
    )
  }

  const row = rowRaw as unknown as {
    company_id: string | null
    form_data: Record<string, unknown> | null
    patient_name: string | null
    patient_email: string | null
    score_physical: number | null
    score_ergonomic: number | null
    score_psychosocial: number | null
    score_violence: number | null
    score_overall: number | null
  }

  const formData = (row.form_data ?? {}) as FormDataNR1 & {
    nome?: string
    email?: string
  }

  const scoreCards: NR1ScoreCard[] = [
    { label: 'Físico', value: row.score_physical ?? null, maxValue: 5 },
    { label: 'Ergonômico', value: row.score_ergonomic ?? null, maxValue: 5 },
    {
      label: 'Psicossocial',
      value: row.score_psychosocial ?? null,
      maxValue: 5,
    },
    {
      label: 'Violência / Assédio',
      value: row.score_violence ?? null,
      maxValue: 5,
    },
  ]

  let companyName: string | null = null
  if (row.company_id) {
    const { data: coRaw } = await sb
      .from('companies')
      .select('name')
      .eq('id', row.company_id)
      .maybeSingle()
    const co = coRaw as { name: string | null } | null
    companyName = co?.name ?? null
  }

  // Generate AI text
  const config = getAnthropicConfigForTask('general_response')
  const llm = llmService.getLlmInstance(config)
  const messages = toLangChainMessages([
    { role: 'system', content: NR1_SYSTEM_PROMPT },
    {
      role: 'human',
      content: buildUserPrompt(
        {
          ...formData,
          nr1_role: formData.nr1_role,
          department: formData.department,
          nr1_work_time: formData.nr1_work_time,
          biggest_risk: formData.biggest_risk,
          satisfaction_level: formData.satisfaction_level,
          had_accident: formData.had_accident,
        },
        scoreCards
      ),
    },
  ])

  const response = await llm.invoke(messages)
  const aiText =
    typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)

  if (!aiText?.trim()) {
    throw new Error('[nr1-laudo] LLM returned empty content')
  }

  const pdfBuffer = buildPdfBuffer({
    evaluationId,
    formData: {
      ...formData,
      nome: row.patient_name ?? formData.nome,
      email: row.patient_email ?? formData.email,
    },
    scores: scoreCards,
    aiText,
    companyName,
  })

  const fileName = `nr1-laudo_${evaluationId}_${Date.now()}.pdf`
  const { error: uploadErr } = await sb.storage
    .from(BUCKET)
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })
  if (uploadErr) {
    throw new Error(`[nr1-laudo] Upload failed: ${uploadErr.message}`)
  }

  const {
    data: { publicUrl },
  } = sb.storage.from(BUCKET).getPublicUrl(fileName)

  await sb
    .from('mental_health_evaluations')
    .update({
      laudo_pdf_url: publicUrl,
      laudo_markdown: aiText,
      status: 'completed',
    })
    .eq('id', evaluationId)

  return { pdfUrl: publicUrl }
}
