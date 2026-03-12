import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { NextResponse } from 'next/server'

/** Dev-only: load test PDFs from exam_examples for automation. */
const TEST_FILES = [
  'Bernardo Gomes - ENMG - Laudo - 23.12.20 - Copia.pdf',
  'Bernardo Gomes - ENMG - Tabela - 23.12.20.pdf',
  'IQ Report IN.pdf',
  'Laudo Completo 02_12_2025 (5).PDF',
  'Ressonancia coluna - laudo.pdf',
  'exams - Copia.pdf',
  'laudo_painel de neuropatias.pdf',
]

export async function GET() {
  if (process.env.NEXT_PUBLIC_AVALIACAO_DEV_MODE !== 'true') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const baseDir = join(
    process.cwd(),
    '..',
    'claude_artifact',
    'new_products',
    'exam_examples'
  )
  const files: { name: string; size: number; data: string }[] = []

  for (const name of TEST_FILES) {
    try {
      const path = join(baseDir, name)
      const buf = await readFile(path)
      const base64 = buf.toString('base64')
      files.push({
        name,
        size: buf.length,
        data: `data:application/pdf;base64,${base64}`,
      })
    } catch (err) {
      console.error(`[load-test-files] Failed to read ${name}:`, err)
    }
  }

  return NextResponse.json({ files })
}
