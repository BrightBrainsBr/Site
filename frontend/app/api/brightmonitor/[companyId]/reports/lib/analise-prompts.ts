// frontend/app/api/brightmonitor/[companyId]/reports/lib/analise-prompts.ts

import type { PGRContext } from './build-context'

function formatCompactData(ctx: PGRContext): string {
  const d = ctx.domainScores
  const lines: string[] = [
    `Empresa: ${ctx.company.name} | CNPJ: ${ctx.company.cnpj}`,
    ctx.cycle
      ? `Ciclo: ${ctx.cycle.label} (${ctx.cycle.starts_at} a ${ctx.cycle.ends_at})`
      : 'Ciclo: não definido',
    `Avaliações: ${ctx.assessmentCount}`,
    '',
    `Scores (1–5 Likert): Físico=${d.physical?.toFixed(2) ?? 'N/A'} | Ergonômico=${d.ergonomic?.toFixed(2) ?? 'N/A'} | Psicossocial=${d.psychosocial?.toFixed(2) ?? 'N/A'} | Violência=${d.violence?.toFixed(2) ?? 'N/A'} | Geral=${d.overall?.toFixed(2) ?? 'N/A'}`,
  ]

  if (Object.keys(ctx.scoresByDepartment).length > 0) {
    lines.push('', 'Scores por departamento:')
    for (const [dept, s] of Object.entries(ctx.scoresByDepartment)) {
      lines.push(
        `  ${dept} (n=${s.n}): F=${s.physical} E=${s.ergonomic} P=${s.psychosocial} V=${s.violence}`
      )
    }
  }

  if (Object.keys(ctx.psychosocialAxes).length > 0) {
    lines.push('', 'Eixos psicossociais:')
    for (const [axis, val] of Object.entries(ctx.psychosocialAxes)) {
      lines.push(`  ${axis}: ${val.toFixed(2)}`)
    }
  }

  const i = ctx.incidents
  lines.push(
    '',
    `Incidentes: acidentes=${i.accidents}, quase-acidentes=${i.nearMisses}, doenças=${i.workDiseases}, total=${i.total}`,
    `Assédio: ${ctx.harassmentCount} relato(s)`
  )

  if (ctx.actions.length > 0) {
    lines.push('', `Ações cadastradas: ${ctx.actions.length}`)
    const pending = ctx.actions.filter((a) => a.status === 'pendente').length
    const inProgress = ctx.actions.filter(
      (a) => a.status === 'em_andamento'
    ).length
    const done = ctx.actions.filter((a) => a.status === 'concluido').length
    lines.push(
      `  Pendentes: ${pending} | Em andamento: ${inProgress} | Concluídas: ${done}`
    )
  }

  if (Object.keys(ctx.chemicalExposures).length > 0) {
    lines.push('', 'Exposições químicas:')
    for (const [agent, count] of Object.entries(ctx.chemicalExposures)) {
      lines.push(`  ${agent}: ${count}`)
    }
  }

  if (Object.keys(ctx.biologicalExposures).length > 0) {
    lines.push('', 'Exposições biológicas:')
    for (const [agent, count] of Object.entries(ctx.biologicalExposures)) {
      lines.push(`  ${agent}: ${count}`)
    }
  }

  const p = ctx.perceptionSummary
  if (p.avgSatisfaction != null || p.topRisks.length > 0) {
    lines.push('', 'Percepção dos trabalhadores:')
    if (p.avgSatisfaction != null)
      lines.push(`  Satisfação média: ${p.avgSatisfaction.toFixed(2)}`)
    if (p.topRisks.length > 0)
      lines.push(`  Principais riscos: ${p.topRisks.join(', ')}`)
    if (p.topSuggestions.length > 0)
      lines.push(`  Sugestões: ${p.topSuggestions.join(', ')}`)
  }

  return lines.join('\n')
}

const ANALYST_SYSTEM = `Você é um analista de dados de saúde ocupacional com especialização em NR-1 e riscos psicossociais. Sua análise deve ser:
- Objetiva e baseada nos dados fornecidos
- Em Markdown válido com ## seções e ### subseções
- Em português brasileiro, estilo técnico mas acessível
- Com insights acionáveis e recomendações práticas
- Não inclua saudações, assinaturas ou metadata — apenas a análise`

export function getAnaliseGeralPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${ANALYST_SYSTEM}

Gere um PANORAMA GERAL da saúde ocupacional da empresa, incluindo:
1. Resumo executivo — situação geral em 2-3 parágrafos
2. Análise comparativa dos domínios (físico, ergonômico, psicossocial, violência)
3. Departamentos mais críticos e porquê
4. Tendências e padrões identificados
5. Top 3 riscos que requerem ação imediata
6. Recomendações estratégicas priorizadas`,
    user: `Analise os dados abaixo e gere um panorama geral da saúde ocupacional:

${formatCompactData(ctx)}`,
  }
}

export function getAnalisePsicossocialPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${ANALYST_SYSTEM}

Gere uma ANÁLISE PSICOSSOCIAL DETALHADA focando nos 8 eixos da organização do trabalho:
1. Diagnóstico por eixo — qual está mais crítico e porquê
2. Correlações entre eixos (ex: carga alta + autonomia baixa = burnout)
3. Impacto por departamento — quais setores apresentam maior risco psicossocial
4. Relação com indicadores de saúde (afastamentos, incidentes)
5. Comparação com benchmarks NR-1 (score ≥3 = atenção, ≥4 = crítico)
6. Intervenções recomendadas por eixo
7. Referência a fatores de proteção existentes`,
    user: `Analise os dados psicossociais abaixo:

${formatCompactData(ctx)}`,
  }
}

export function getAnaliseCriticosPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${ANALYST_SYSTEM}

Gere uma análise de RISCOS CRÍTICOS — foque exclusivamente nos pontos que requerem atenção urgente:
1. Domínios com score ≥ 3.5 (alto/crítico na escala Likert)
2. Departamentos com concentração de risco
3. Exposições químicas/biológicas com maior frequência
4. Relação acidentes/incidentes com áreas de risco
5. Gaps no plano de ação (riscos sem ações associadas)
6. Assédio e violência — análise de prevalência
7. Para cada risco crítico: descrição, impacto potencial, ação recomendada e prazo sugerido`,
    user: `Identifique e analise os riscos críticos nos dados abaixo:

${formatCompactData(ctx)}`,
  }
}

export function getAnalisePriorizarPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${ANALYST_SYSTEM}

Gere uma PRIORIZAÇÃO DE AÇÕES com base na análise dos dados:
1. Classificação das ações existentes por urgência × impacto (matriz Eisenhower)
2. Ações faltantes — riscos identificados sem ação associada
3. Quick wins — ações de alto impacto e baixo custo
4. Roadmap trimestral sugerido (Mês 1, Mês 2, Mês 3)
5. KPIs de acompanhamento para cada ação
6. Estimativa de recursos necessários
7. Ranking final: Top 10 ações priorizadas com justificativa`,
    user: `Com base nos dados abaixo, priorize as ações para mitigação de riscos:

${formatCompactData(ctx)}`,
  }
}
