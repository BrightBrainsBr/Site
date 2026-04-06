// frontend/agents/action-plan-generator/prompts/action-plan-generator.prompts.ts

import type { GROContext } from '../models/action-plan-generator.interface'

export const ACTION_PLAN_SYSTEM = `Você é um especialista em saúde mental ocupacional e conformidade com a NR-1 no Brasil.
Com base nos dados do GRO (Gerenciamento de Riscos Ocupacionais) psicossocial, gere planos de ação práticos e específicos.

Regras:
- Cada plano deve ter descrição clara e acionável
- Prioridade baseada na severidade dos dados (alta = risco crítico, media = risco moderado, baixa = melhoria)
- Sugira responsáveis genéricos quando apropriado (RH, Gestor, SESMT, Comitê SST)
- Prazos sugeridos devem ser realistas (30, 60, 90, 180 dias)
- Gere entre 5 e 10 planos de ação
- Foque em intervenções baseadas em evidências
- Considere dimensões AEP (pressão, autonomia, pausas, relações, cognitiva, ambiente)
- Se um departamento específico foi solicitado, foque nele
- Quando não há dados de avaliações ainda, gere um plano de ação de implantação inicial da NR-1 com ações obrigatórias de conformidade

Responda APENAS com JSON válido no formato especificado.`

export function buildGroContextMessage(ctx: GROContext, department?: string): string {
  const lines: string[] = [
    '## Dados do GRO Psicossocial',
    '',
    `Total de avaliações: ${ctx.totalEvaluations}`,
    `Departamentos: ${ctx.departments.join(', ') || 'N/I'}`,
    '',
    '### Médias das Escalas Clínicas:',
  ]

  for (const [scale, avg] of Object.entries(ctx.scaleAverages)) {
    lines.push(`- ${scale.toUpperCase()}: ${avg}`)
  }

  lines.push('', '### Dimensões AEP (Avaliação Ergonômica Psicossocial):')
  for (const [dim, avg] of Object.entries(ctx.aepDimensions)) {
    lines.push(`- ${dim}: ${avg}`)
  }

  lines.push('', '### Distribuição SRQ-20:')
  lines.push(`- Negativo (0-7): ${ctx.srq20Distribution.negative}`)
  lines.push(`- Moderado (8-11): ${ctx.srq20Distribution.moderate}`)
  lines.push(`- Elevado (12-16): ${ctx.srq20Distribution.elevated}`)
  lines.push(`- Crítico (17-20): ${ctx.srq20Distribution.critical}`)

  if (department) {
    lines.push('', `### Filtro: Departamento "${department}"`)
  }

  if (ctx.totalEvaluations === 0) {
    lines.push(
      '',
      '### ATENÇÃO: Nenhuma avaliação realizada ainda neste ciclo.',
      'Gere um plano de ação de IMPLANTAÇÃO INICIAL da NR-1 com as ações obrigatórias para:',
      '1. Realizar o mapeamento e inventário de riscos psicossociais (NR-1: 1.5.4)',
      '2. Estruturar o Programa de Gerenciamento de Riscos (PGR)',
      '3. Comunicar e mobilizar colaboradores para participação na avaliação BrightMonitor',
      '4. Designar responsáveis SST e constituir Comitê Médico Interdisciplinar',
      '5. Estabelecer cronograma de avaliações periódicas'
    )
  } else {
    lines.push('', 'Com base nesses dados, gere planos de ação para mitigar os riscos psicossociais identificados.')
  }

  return lines.join('\n')
}
