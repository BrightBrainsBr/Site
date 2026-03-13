import Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'
import { buildReportPromptData } from '~/features/assessment/helpers/build-report-data'

export const runtime = 'nodejs'
export const maxDuration = 300

const MODEL = 'claude-sonnet-4-6'
type SupportedImageMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
const SUPPORTED_IMAGE_MIME_TYPES: SupportedImageMime[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const CFM_SYSTEM_PREAMBLE = `Você é uma IA de Apoio à Decisão Clínica do programa "Bright Precision" (Bright Brains · Instituto da Mente).

REGRAS OBRIGATÓRIAS DE CONFORMIDADE — CFM nº 2.454/2026:
- Classificação: Médio Risco (Art. 13, Anexo II)
- Papel: Ferramenta de apoio à decisão (Art. 4º, I) — NÃO substitui o médico
- Todas as saídas são SUGESTÕES PRELIMINARES NÃO VINCULANTES ao Comitê Médico Interdisciplinar
- O médico pode aceitar, modificar ou rejeitar qualquer sugestão (Art. 18)
- Use sempre linguagem condicional: "sugere-se", "considera-se", "pode-se avaliar"
- NUNCA use linguagem prescritiva ou imperativa
- Inclua CID-10 em todas as hipóteses diagnósticas
- Cite evidências (APA, CANMAT, NICE, guidelines brasileiros) quando relevante

Escreva em português brasileiro, linguagem técnica profissional.`

const STAGE_PROMPTS = [
  {
    stage: 1,
    name: 'Análise Clínica & Diagnósticos',
    system: `${CFM_SYSTEM_PREAMBLE}

Produza as seções 1-4 do relatório:

## 1. SUMÁRIO EXECUTIVO
Síntese dos achados mais relevantes (máx 200 palavras). Incluir: perfil do paciente, queixa principal, escalas mais significativas, nível de urgência.

## 2. INTEGRAÇÃO TÉCNICA DOS DADOS
Análise integrada de:
- Dados biométricos e wearables (se disponíveis)
- Correlação entre escalas clínicas
- Achados da entrevista de triagem
- Histórico médico e familiar
- Estilo de vida e fatores contextuais

## 3. HIPÓTESES DIAGNÓSTICAS — CID-10
Para cada hipótese:
- Código CID-10 e descrição
- Nível de confiança (Alta / Moderada / Baixa)
- Evidências dos dados que suportam
- Diagnósticos diferenciais a considerar

## 4. ESTRATIFICAÇÃO DE RISCO
- Risco atual (baixo / moderado / alto / crítico)
- Fatores de risco identificados
- Fatores de proteção identificados
- Bandeiras vermelhas (se houver)
- Recomendação de urgência`,
    userPrefix: 'Analise os dados clínicos e produza as seções 1-4:\n\n',
  },
  {
    stage: 2,
    name: 'Terapêutica & Neuromodulação',
    system: `${CFM_SYSTEM_PREAMBLE}

Com base na análise anterior, produza as seções 5-6:

## 5. FUNDAMENTAÇÃO CIENTÍFICA
Referências e evidências que fundamentam as hipóteses diagnósticas. Cite guidelines (APA, CANMAT, NICE, ABP) e estudos relevantes.

## 6. SUGESTÕES TERAPÊUTICAS AO COMITÊ MÉDICO
Organize em subsecções:

### 6.1 Farmacoterapia
Para cada sugestão: molécula, dose inicial, titulação, justificativa baseada em evidências. Usar linguagem condicional.

### 6.2 Psicoterapia
Abordagem sugerida, frequência, objetivos terapêuticos.

### 6.3 Neuromodulação
Se indicado: modalidade (EMTr, tDCS, etc.), protocolo sugerido, evidências. Se paciente já fez/faz neuromodulação, considerar histórico.

### 6.4 Intervenções de Estilo de Vida
Exercício, higiene do sono, nutrição, mindfulness — baseadas nos dados do paciente.

### 6.5 Suplementação
Se indicado: sugestões baseadas em evidências (ex: magnésio, vitamina D, ômega-3).

### 6.6 Encaminhamentos
Outros profissionais sugeridos (neuropsicólogo, fonoaudiólogo, etc.).

### 6.7 Orientações ao Paciente
Em linguagem acessível, resumo das recomendações.

### 6.8 Metas Terapêuticas
Curto prazo (1-4 semanas), médio prazo (1-3 meses), longo prazo (6-12 meses).`,
    userPrefix:
      'Com base na análise anterior e dados do paciente, produza as seções 5-6:\n\n',
  },
  {
    stage: 3,
    name: 'Monitoramento & Conformidade',
    system: `${CFM_SYSTEM_PREAMBLE}

Com base nas análises e sugestões anteriores, produza as seções 7-10:

## 7. PLANO DE MONITORAMENTO
- Escalas recomendadas para follow-up
- Frequência de reavaliação sugerida
- Métricas de wearable a monitorar (se aplicável)
- Critérios para reavaliação de urgência
- Indicadores de resposta terapêutica

## 8. REFERÊNCIAS BIBLIOGRÁFICAS
Lista das referências citadas no relatório (formato ABNT ou APA).

## 9. DECLARAÇÃO DE CONFORMIDADE — CFM nº 2.454/2026
Incluir declaração formal:
- Sistema classificado como Médio Risco (Art. 13, Anexo II)
- Opera como ferramenta de apoio à decisão (Art. 4º, I)
- Sob supervisão médica ativa (Art. 18)
- Todas as sugestões são não vinculantes
- O comitê médico mantém autonomia total de decisão
- Data e versão do sistema

## 10. OBSERVAÇÕES FINAIS
Notas adicionais, limitações da análise, dados que seriam desejáveis para maior acurácia.`,
    userPrefix:
      'Com base em todo o relatório anterior, produza as seções 7-10:\n\n',
  },
]

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const requestStart = Date.now()

  console.warn(
    `[report:${requestId}] Starting report generation | model=${MODEL}`
  )

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const body = await request.json()
    const { formData, scores, uploads } = body as {
      formData: AssessmentFormData
      scores: Record<string, number>
      uploads?: { name: string; data: string }[]
    }

    console.warn(
      `[report:${requestId}] Patient: ${formData.nome || 'unnamed'} | ` +
        `Profile: ${formData.publico || 'unknown'} | ` +
        `Scales: ${Object.keys(scores).join(', ')} | ` +
        `Uploads: ${uploads?.length ?? 0} file(s)`
    )

    const patientData = buildReportPromptData(formData, scores)

    type ContentBlock =
      | { type: 'text'; text: string }
      | {
          type: 'document'
          source: {
            type: 'base64'
            media_type: 'application/pdf'
            data: string
          }
        }
      | {
          type: 'image'
          source: {
            type: 'base64'
            media_type: SupportedImageMime
            data: string
          }
        }

    const documentBlocks: ContentBlock[] = []
    if (uploads && uploads.length > 0) {
      for (const file of uploads) {
        const base64Match = file.data.match(/^data:([^;]+);base64,(.+)$/)
        if (!base64Match) continue
        const [, mimeType, base64Data] = base64Match

        if (mimeType === 'application/pdf') {
          documentBlocks.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Data,
            },
          })
          console.warn(`[report:${requestId}] Attached PDF: ${file.name}`)
        } else if (
          SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMime)
        ) {
          documentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as SupportedImageMime,
              data: base64Data,
            },
          })
          console.warn(`[report:${requestId}] Attached image: ${file.name}`)
        }
      }
    }

    const encoder = new TextEncoder()
    let previousContent = ''

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          )
        }

        try {
          for (const cfg of STAGE_PROMPTS) {
            const stageStart = Date.now()
            console.warn(
              `[report:${requestId}] Stage ${cfg.stage} starting: ${cfg.name}`
            )

            send({
              type: 'progress',
              stage: cfg.stage,
              progress: 0,
              message: `Iniciando ${cfg.name}...`,
            })

            const textContent =
              cfg.stage === 1
                ? `${cfg.userPrefix}${patientData}`
                : `${cfg.userPrefix}RELATÓRIO ANTERIOR:\n${previousContent}\n\nDADOS DO PACIENTE:\n${patientData}`

            const userContent: ContentBlock[] =
              cfg.stage === 1 && documentBlocks.length > 0
                ? [
                    ...documentBlocks,
                    {
                      type: 'text' as const,
                      text: `Os documentos acima foram enviados pelo paciente (transcrição da triagem, exames, laudos). Considere-os na análise.\n\n${textContent}`,
                    },
                  ]
                : [{ type: 'text' as const, text: textContent }]

            let fullContent = ''
            const messageStream = anthropic.messages.stream({
              model: MODEL,
              max_tokens: 8192,
              system: cfg.system,
              messages: [{ role: 'user', content: userContent }],
            })

            let chunks = 0
            for await (const event of messageStream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                fullContent += event.delta.text
                chunks++
                if (chunks % 20 === 0) {
                  send({
                    type: 'progress',
                    stage: cfg.stage,
                    progress: Math.min(90, Math.round((chunks / 150) * 100)),
                    message: `Gerando ${cfg.name}...`,
                  })
                }
              }
            }

            const finalMessage = await messageStream.finalMessage()
            const stageMs = Date.now() - stageStart
            console.warn(
              `[report:${requestId}] Stage ${cfg.stage} complete | ` +
                `${stageMs}ms | ` +
                `input_tokens=${finalMessage.usage.input_tokens} | ` +
                `output_tokens=${finalMessage.usage.output_tokens} | ` +
                `stop=${finalMessage.stop_reason}`
            )

            previousContent += `\n\n${fullContent}`

            send({
              type: 'progress',
              stage: cfg.stage,
              progress: 100,
              message: `${cfg.name} concluído.`,
            })

            send({
              type: 'stage_complete',
              stage: cfg.stage,
              content: fullContent,
            })
          }

          const totalMs = Date.now() - requestStart
          console.warn(
            `[report:${requestId}] All stages complete | total=${totalMs}ms`
          )

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (err) {
          const totalMs = Date.now() - requestStart
          console.error(
            `[report:${requestId}] AI generation error after ${totalMs}ms:`,
            err
          )
          send({
            type: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Erro na geração do relatório',
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const totalMs = Date.now() - requestStart
    console.error(
      `[report:${requestId}] Request failed after ${totalMs}ms:`,
      err
    )
    return new Response(JSON.stringify({ error: 'Erro ao iniciar geração' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
