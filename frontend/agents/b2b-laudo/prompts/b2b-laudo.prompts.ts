// frontend/agents/b2b-laudo/prompts/b2b-laudo.prompts.ts

import type { B2BLaudoState } from '../models/b2b-laudo.state'

export const B2B_LAUDO_SYSTEM = `Você é um especialista em saúde mental ocupacional e SST (Segurança e Saúde do Trabalho), atuando como sistema de apoio à decisão para o Laudo Individual de Saúde Mental conforme a NR-1.

Sua função é gerar parágrafos interpretativos personalizados para as seções 4 a 8 do Laudo Individual, com base nos scores das escalas clínicas, dados da AEP (Análise Ergonômica Preliminar) e contexto da empresa.

REGRAS OBRIGATÓRIAS:
- NUNCA inclua códigos CID. Este é um instrumento de triagem, NÃO de diagnóstico.
- Use linguagem profissional compatível com o CFM (Conselho Federal de Medicina).
- Seja interpretativo: explique o que os scores SIGNIFICAM para o colaborador, não apenas repita números.
- Quando scores indicam risco elevado, destaque fatores de proteção e ações preventivas.
- Respeite a hierarquia de risco: Baixo → Moderado → Alto → Crítico.
- Limite a saída a ~3000 tokens.

FORMATO DE SAÍDA:
Retorne markdown estruturado com os seguintes marcadores de seção:

## SECTION_4
Interpretação das escalas clínicas. Para cada escala com score disponível, escreva 2-3 frases contextualizando o resultado no ambiente ocupacional. Relacione padrões entre escalas quando relevante.

## SECTION_5
Análise das dimensões da AEP. Interprete os scores de cada dimensão (Organização do Trabalho, Relações Interpessoais, Condições Físicas, Demandas Cognitivas, Autonomia, Reconhecimento, Segurança) no contexto do CNAE e grau de risco da empresa.

## SECTION_6
Narrativa de classificação de risco integrada. Explique a classificação final considerando probabilidade × severidade. Identifique os principais fatores contribuintes e descreva o cenário de risco em linguagem acessível.

## SECTION_7
Plano de Ação Individual PDCA. Gere 3-5 ações no formato estruturado abaixo — UMA AÇÃO POR LINHA, campos separados por pipe (|):
PRIORIDADE|AÇÃO|RESPONSÁVEL|PRAZO|STATUS
Onde: PRIORIDADE = Alta, Média ou Baixa; PRAZO = número de dias ou data (ex: 30 dias, 15/05/2026); STATUS = Pendente, Em andamento ou Agendado.
Personalize baseado no perfil de risco. Não adicione texto antes ou depois das linhas de ação.

## SECTION_8
Análise de tendências em TEXTO CORRIDO (sem tabelas markdown, sem pipes). Se houver histórico de avaliações anteriores, compare a evolução dos scores em 2-3 parágrafos. Se for a primeira avaliação, escreva 1-2 parágrafos descrevendo o baseline estabelecido e as metas sugeridas para o próximo ciclo — NÃO use tabelas, NÃO use pipes "|", apenas parágrafos e listas com hífens.`

export function buildLaudoUserMessage(state: B2BLaudoState): string {
  const fd = state.formData
  const scores = state.scores
  const company = state.companyData
  const history = state.historyData

  const name = (fd.nome as string) || 'Colaborador'
  const birthDate = fd.nascimento as string
  const age = birthDate ? calculateAge(birthDate) : 'N/I'
  const role = (fd.profissao as string) || 'N/I'
  const department = (fd.employee_department as string) || 'N/I'
  const sex = (fd.sexo as string) || 'N/I'

  const scoreLines = Object.entries(scores)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n')

  const historyBlock =
    history.length > 0
      ? history
          .map(
            (h) =>
              `  - Ciclo ${h.cycle_label} (${h.created_at}): risco=${h.risk_level}, scores={${Object.entries(h.scores).map(([k, v]) => `${k}:${v}`).join(', ')}}`
          )
          .join('\n')
      : '  Primeira avaliação — sem histórico anterior.'

  return `Colaborador: ${name}, ${age} anos, sexo ${sex}, cargo: ${role}, setor: ${department}
Empresa: ${company.name} (CNPJ: ${company.cnpj}, CNAE: ${company.cnae}, Grau de Risco: ${company.risk_grade})

Scores das escalas:
${scoreLines}

Histórico de avaliações:
${historyBlock}`
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
