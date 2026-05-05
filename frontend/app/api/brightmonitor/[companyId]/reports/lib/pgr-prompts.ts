// frontend/app/api/brightmonitor/[companyId]/reports/lib/pgr-prompts.ts

import type { PGRContext } from './build-context'

function formatCompanyBlock(ctx: PGRContext): string {
  const c = ctx.company
  return [
    `Empresa: ${c.name}`,
    `CNPJ: ${c.cnpj}`,
    c.cnae ? `CNAE: ${c.cnae}` : null,
    `Departamentos: ${c.departments.join(', ') || 'Não informados'}`,
    c.sst_responsible_name
      ? `Responsável SST: ${c.sst_responsible_name} (${c.sst_responsible_role ?? 'Não informado'})`
      : null,
    ctx.cycle
      ? `Ciclo: ${ctx.cycle.label} (${ctx.cycle.starts_at} a ${ctx.cycle.ends_at})`
      : 'Ciclo: Não definido',
    `Total de avaliações NR-1: ${ctx.assessmentCount}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function formatDomainScores(ctx: PGRContext): string {
  const d = ctx.domainScores
  return [
    `Físico: ${d.physical?.toFixed(2) ?? 'N/A'}`,
    `Ergonômico: ${d.ergonomic?.toFixed(2) ?? 'N/A'}`,
    `Psicossocial: ${d.psychosocial?.toFixed(2) ?? 'N/A'}`,
    `Violência: ${d.violence?.toFixed(2) ?? 'N/A'}`,
    `Geral: ${d.overall?.toFixed(2) ?? 'N/A'}`,
  ].join(' | ')
}

function formatDeptScores(ctx: PGRContext): string {
  const entries = Object.entries(ctx.scoresByDepartment)
  if (entries.length === 0) return 'Nenhum departamento identificado.'
  return entries
    .map(
      ([dept, s]) =>
        `- ${dept} (n=${s.n}): Físico=${s.physical} | Ergonômico=${s.ergonomic} | Psicossocial=${s.psychosocial} | Violência=${s.violence}`
    )
    .join('\n')
}

function formatPsychosocialAxes(ctx: PGRContext): string {
  const entries = Object.entries(ctx.psychosocialAxes)
  if (entries.length === 0)
    return 'Dados de eixos psicossociais não disponíveis.'
  return entries.map(([k, v]) => `- ${k}: ${v.toFixed(2)}`).join('\n')
}

function formatInventory(ctx: PGRContext): string {
  if (ctx.inventory.length === 0) return 'Nenhum item de inventário registrado.'
  return ctx.inventory
    .map(
      (item) =>
        `- [${item.risk_type}] ${item.description} (Prob: ${item.probability}, Sev: ${item.severity})`
    )
    .join('\n')
}

function formatActions(ctx: PGRContext): string {
  if (ctx.actions.length === 0) return 'Nenhuma ação registrada.'
  return ctx.actions
    .map(
      (a) =>
        `- ${a.description} | Status: ${a.status} | Resp: ${a.responsible ?? 'N/A'} | Prazo: ${a.deadline ?? 'N/A'}`
    )
    .join('\n')
}

function formatIncidents(ctx: PGRContext): string {
  const i = ctx.incidents
  return `Acidentes: ${i.accidents} | Quase-acidentes: ${i.nearMisses} | Doenças ocupacionais: ${i.workDiseases} | Total eventos: ${i.total}`
}

function formatExposures(ctx: PGRContext): string {
  const chem = Object.entries(ctx.chemicalExposures)
  const bio = Object.entries(ctx.biologicalExposures)
  const parts: string[] = []
  if (chem.length > 0) {
    parts.push(
      'Agentes químicos:\n' +
        chem
          .map(([agent, count]) => `  - ${agent}: ${count} relato(s)`)
          .join('\n')
    )
  }
  if (bio.length > 0) {
    parts.push(
      'Agentes biológicos:\n' +
        bio
          .map(([agent, count]) => `  - ${agent}: ${count} relato(s)`)
          .join('\n')
    )
  }
  return parts.length > 0
    ? parts.join('\n')
    : 'Nenhuma exposição química/biológica identificada.'
}

function formatPerception(ctx: PGRContext): string {
  const p = ctx.perceptionSummary
  return [
    `Satisfação média: ${p.avgSatisfaction?.toFixed(2) ?? 'N/A'}`,
    `Principais riscos percebidos: ${p.topRisks.length > 0 ? p.topRisks.join(', ') : 'N/A'}`,
    `Principais sugestões: ${p.topSuggestions.length > 0 ? p.topSuggestions.join(', ') : 'N/A'}`,
  ].join('\n')
}

function buildFullDataBlock(ctx: PGRContext): string {
  return [
    '=== DADOS DA EMPRESA ===',
    formatCompanyBlock(ctx),
    '',
    '=== SCORES POR DOMÍNIO (escala 1–5, Likert) ===',
    formatDomainScores(ctx),
    '',
    '=== SCORES POR DEPARTAMENTO ===',
    formatDeptScores(ctx),
    '',
    '=== EIXOS PSICOSSOCIAIS ===',
    formatPsychosocialAxes(ctx),
    '',
    '=== INVENTÁRIO DE RISCOS ===',
    formatInventory(ctx),
    '',
    '=== PLANO DE AÇÃO ===',
    formatActions(ctx),
    '',
    '=== INCIDENTES E ACIDENTES ===',
    formatIncidents(ctx),
    `Relatos de assédio: ${ctx.harassmentCount}`,
    '',
    '=== EXPOSIÇÕES QUÍMICAS E BIOLÓGICAS ===',
    formatExposures(ctx),
    '',
    '=== PERCEPÇÃO DOS TRABALHADORES ===',
    formatPerception(ctx),
  ].join('\n')
}

const NR1_SPECIALIST_SYSTEM = `Você é um especialista em segurança e saúde do trabalho (SST), com profundo conhecimento da NR-1 (Norma Regulamentadora nº 1 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais), especialmente das atualizações de 2024/2025 que incluem riscos psicossociais no PGR.

Regras de formatação:
- Gere saída em Markdown válido
- Use ## para seções principais, ### para subseções
- Use listas com - para itens
- Use **negrito** para termos-chave e referências legais
- Inclua referências aos artigos relevantes da NR-1 (§1.5.3, §1.5.4, §1.5.5, etc.)
- Escreva em português brasileiro formal, estilo técnico-jurídico
- Não inclua saudações, assinaturas ou metadata — apenas o conteúdo do documento`

export function getInventarioPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${NR1_SPECIALIST_SYSTEM}

Você vai gerar o INVENTÁRIO DE RISCOS OCUPACIONAIS conforme NR-1 §1.5.4.
O documento deve conter:
1. Identificação dos perigos e fatores de risco (§1.5.4.1)
2. Avaliação de riscos por domínio (físico, ergonômico, psicossocial, violência)
3. Classificação dos riscos por probabilidade × severidade
4. Exposições químicas e biológicas identificadas
5. Análise por departamento
6. Priorização com base na matriz de risco GHE`,
    user: `Gere o Inventário de Riscos Ocupacionais para a empresa abaixo, conforme NR-1 §1.5.4.

${buildFullDataBlock(ctx)}`,
  }
}

export function getPlanoPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${NR1_SPECIALIST_SYSTEM}

Você vai gerar o PLANO DE AÇÃO 5W2H conforme NR-1 §1.5.5 (Controle dos Riscos).
O documento deve conter:
1. Ações de prevenção e controle (§1.5.5.1)
2. Formato 5W2H: O quê, Por quê, Onde, Quando, Quem, Como, Quanto custa
3. Cronograma de implementação com prazos
4. Definição de responsáveis por ação
5. Indicadores de acompanhamento
6. Priorização: riscos críticos e altos primeiro`,
    user: `Gere o Plano de Ação 5W2H para a empresa abaixo, conforme NR-1 §1.5.5.

${buildFullDataBlock(ctx)}`,
  }
}

export function getPsicossocialPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${NR1_SPECIALIST_SYSTEM}

Você vai gerar o LAUDO DE AVALIAÇÃO PSICOSSOCIAL conforme NR-1 §1.5.3.2.1 (Avaliação de riscos psicossociais no trabalho).
O documento deve conter:
1. Metodologia de avaliação utilizada
2. Análise dos 8 eixos psicossociais (carga, ritmo, autonomia, liderança, relações, reconhecimento, clareza, equilíbrio)
3. Diagnóstico organizacional por departamento
4. Fatores de proteção e de risco identificados
5. Correlação com indicadores de saúde (afastamentos, incidentes)
6. Recomendações preventivas e interventivas
7. Referências à NR-1 §1.5.3.2.1 e Convenção OIT nº 190`,
    user: `Gere o Laudo de Avaliação Psicossocial para a empresa abaixo, conforme NR-1 §1.5.3.2.1.

${buildFullDataBlock(ctx)}`,
  }
}

export function getPGRCompletoPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${NR1_SPECIALIST_SYSTEM}

Você vai gerar o PGR COMPLETO — Programa de Gerenciamento de Riscos conforme NR-1 §1.5.
Este é o documento mais abrangente e deve conter TODAS as seções obrigatórias:

1. **Introdução e Objetivo** — escopo do PGR (§1.5.1)
2. **Identificação da Empresa** — razão social, CNPJ, CNAE, endereço, atividades
3. **Inventário de Riscos** — resumo dos perigos identificados (§1.5.4)
4. **Avaliação de Riscos** — classificação por domínio e matriz de risco (§1.5.4.4)
5. **Análise Psicossocial** — eixos de organização do trabalho (§1.5.3.2.1)
6. **Exposições Ambientais** — agentes químicos, biológicos, físicos
7. **Controle de Riscos** — medidas preventivas e de proteção (§1.5.5)
8. **Plano de Ação** — cronograma 5W2H com responsáveis e prazos
9. **Monitoramento e Revisão** — indicadores, periodicidade, critérios de revisão (§1.5.6)
10. **Análise de Acidentes e Incidentes** — dados do ciclo
11. **Programa de Prevenção ao Assédio** — diretrizes (§1.4.1.1)
12. **Conclusão e Assinaturas** — espaço para responsável técnico

Gere um documento extenso e completo, com pelo menos 15 seções/subseções.`,
    user: `Gere o PGR Completo para a empresa abaixo, conforme NR-1 §1.5.

${buildFullDataBlock(ctx)}`,
  }
}

export function getAntiAssedioPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${NR1_SPECIALIST_SYSTEM}

Você vai gerar a POLÍTICA DE PREVENÇÃO E COMBATE AO ASSÉDIO conforme NR-1 §1.4.1.1 e Lei nº 14.457/2022.
O documento deve conter:
1. Objetivo e abrangência da política
2. Definições (assédio moral, sexual, violência no trabalho)
3. Canais de denúncia e fluxo de apuração
4. Medidas preventivas (treinamento, conscientização)
5. Procedimentos de investigação e sanções
6. Proteção ao denunciante (não-retaliação)
7. Indicadores de monitoramento
8. Referências legais (NR-1 §1.4.1.1, Lei 14.457/2022, Convenção OIT 190)
9. Dados atuais de relatos e assédio na empresa`,
    user: `Gere a Política de Prevenção e Combate ao Assédio para a empresa abaixo.

${buildFullDataBlock(ctx)}`,
  }
}

export function getOSSSTPrompt(ctx: PGRContext): {
  system: string
  user: string
} {
  return {
    system: `${NR1_SPECIALIST_SYSTEM}

Você vai gerar a ORDEM DE SERVIÇO DE SEGURANÇA E SAÚDE NO TRABALHO conforme NR-1 §1.4.1 alínea c.
A Ordem de Serviço deve:
1. Informar os trabalhadores sobre os riscos ocupacionais existentes no local de trabalho
2. Descrever as medidas de prevenção adotadas pela empresa
3. Apresentar os resultados da avaliação de riscos
4. Definir procedimentos a serem adotados em caso de acidente
5. Estabelecer obrigações e responsabilidades dos trabalhadores
6. Incluir orientações sobre uso de EPIs quando aplicável
7. Conter assinatura do responsável técnico e data de emissão
8. Ser redigida em linguagem acessível ao trabalhador`,
    user: `Gere a Ordem de Serviço de Segurança e Saúde no Trabalho para a empresa abaixo, conforme NR-1 §1.4.1 alínea c.

${buildFullDataBlock(ctx)}`,
  }
}
