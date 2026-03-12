import type { AssessmentFormData } from '../components/assessment.interface'
import { SCALE_RANGES } from '../components/constants/scoring-ranges'

function arr<T>(val: T[] | undefined | null): T[] {
  return Array.isArray(val) ? val : []
}

export function buildReportPromptData(
  data: AssessmentFormData,
  scores: Record<string, number>
): string {
  const s: string[] = []
  const today = new Date().toLocaleDateString('pt-BR')

  s.push(`## Dados do Paciente
- Nome: ${data.nome}
- Nascimento: ${data.nascimento}
- Sexo: ${data.sexo}
- Profissão: ${data.profissao}
- Escolaridade: ${data.escolaridade}
- Peso: ${data.peso} kg | Altura: ${data.altura} cm
- Data do relatório: ${today}`)

  s.push(`## Perfil Clínico
- Público: ${data.publico}
- Queixa principal: ${data.queixaPrincipal}
- Tempo dos sintomas: ${data.tempoSintomas}
- Evento desencadeador: ${data.eventoDesencadeador}`)

  if (data.diagAnterior === 'sim') {
    s.push(`## Histórico
- Diagnósticos anteriores: ${data.diagAnterioresDetalhe}
- Psicoterapia: ${data.psicoterapia}
- Internação: ${data.internacao}
- Condições crônicas: ${arr(data.condicoesCronicas).join(', ') || 'Nenhuma'}
- Exames neurológicos: ${data.examesNeuro}${data.examesNeuroDetalhe ? ` — ${data.examesNeuroDetalhe}` : ''}`)
  }

  const sintomas = arr(data.sintomasAtuais)
  if (sintomas.length > 0) {
    s.push(`## Sintomas Atuais
${sintomas.join(', ')}${data.outrosSintomas ? `\nOutros: ${data.outrosSintomas}` : ''}`)
  }

  const scaleLines: string[] = []
  for (const [key, score] of Object.entries(scores)) {
    const config = SCALE_RANGES[key]
    if (!config) continue
    const range = config.ranges.find(
      (r) => score >= r.min && score <= r.max
    )
    scaleLines.push(
      `- ${config.label}: ${score} pts → ${range?.label ?? 'N/A'}`
    )
  }
  if (scaleLines.length > 0) {
    s.push(`## Escalas Clínicas\n${scaleLines.join('\n')}`)
  }

  const meds = arr(data.medicamentos)
  if (meds.length > 0) {
    const medLines = meds.map(
      (m) => `- ${m.nome} ${m.dose} (${m.tempo})`
    )
    s.push(`## Medicamentos Atuais\n${medLines.join('\n')}`)
    if (data.medPassado === 'sim') {
      s.push(`Medicamentos passados: ${data.medPassadoDetalhe}`)
    }
    if (data.efeitosAdversos) {
      s.push(`Efeitos adversos: ${data.efeitosAdversos}`)
    }
    if (data.alergias) {
      s.push(`Alergias: ${data.alergias}`)
    }
  }

  const sups = arr(data.suplementos)
  if (sups.length > 0) {
    const supLines = sups.map(
      (sup) => `- ${sup.nome} ${sup.dose}`
    )
    s.push(`## Suplementos\n${supLines.join('\n')}`)
  }

  const lifestyle: string[] = []
  if (data.estadoCivil)
    lifestyle.push(`Estado civil: ${data.estadoCivil}`)
  if (data.satisfacaoRelacionamento)
    lifestyle.push(
      `Satisfação relacionamento: ${data.satisfacaoRelacionamento}`
    )
  if (data.situacaoProfissional)
    lifestyle.push(
      `Situação profissional: ${data.situacaoProfissional}`
    )
  if (data.cargaHoraria)
    lifestyle.push(`Carga horária: ${data.cargaHoraria}`)
  if (data.horaDormir)
    lifestyle.push(
      `Sono: ${data.horaDormir} – ${data.horaAcordar}, qualidade: ${data.qualidadeSono}`
    )
  if (data.atividadeFisica)
    lifestyle.push(`Atividade física: ${data.atividadeFisica}`)
  if (data.cafeina) lifestyle.push(`Cafeína: ${data.cafeina}`)
  if (data.tabaco && data.tabaco !== 'Nunca')
    lifestyle.push(`Tabaco: ${data.tabaco}`)
  if (data.cannabis && data.cannabis !== 'Nunca')
    lifestyle.push(`Cannabis: ${data.cannabis}`)
  if (data.estresse) lifestyle.push(`Nível estresse: ${data.estresse}`)
  if (data.redeApoio) lifestyle.push(`Rede de apoio: ${data.redeApoio}`)
  const stressSources = arr(data.fontesEstresse)
  if (stressSources.length > 0)
    lifestyle.push(
      `Fontes de estresse: ${stressSources.join(', ')}`
    )
  if (data.neuromod && data.neuromod !== 'Nunca') {
    lifestyle.push(
      `Neuromodulação: ${data.neuromod}${data.neuromodDetalhes ? ` — ${data.neuromodDetalhes}` : ''}`
    )
  }
  if (data.estiloVidaObs)
    lifestyle.push(`Obs: ${data.estiloVidaObs}`)
  if (lifestyle.length > 0) {
    s.push(`## Estilo de Vida\n${lifestyle.join('\n')}`)
  }

  if (data.usaWearable === 'Sim') {
    const wLines: string[] = []
    if (data.wDispositivo)
      wLines.push(`Dispositivo: ${data.wDispositivo}`)
    if (data.wFCRepouso)
      wLines.push(`FC repouso: ${data.wFCRepouso} bpm`)
    if (data.wHRV) wLines.push(`HRV: ${data.wHRV} ms`)
    if (data.wSonoDuracao)
      wLines.push(`Sono (horas): ${data.wSonoDuracao}`)
    if (data.wPassos) wLines.push(`Passos/dia: ${data.wPassos}`)
    if (data.wEstresse)
      wLines.push(`Score estresse: ${data.wEstresse}`)
    if (data.wearableObs) wLines.push(`Obs: ${data.wearableObs}`)
    if (wLines.length > 0) {
      s.push(`## Dados de Wearable\n${wLines.join('\n')}`)
    }
  }

  const familyConditions = arr(data.familiaCondicoes)
  if (familyConditions.length > 0) {
    s.push(`## Histórico Familiar
Condições: ${familyConditions.join(', ')}${data.familiaDetalhes ? `\nDetalhes: ${data.familiaDetalhes}` : ''}`)
  }

  if (data.transcricaoTriagem) {
    s.push(
      `## Transcrição da Entrevista de Triagem\n${data.transcricaoTriagem}`
    )
  }
  if (data.triagemResumo) {
    s.push(`## Resumo do Entrevistador\n${data.triagemResumo}`)
  }

  const laudos = arr(data.laudosAnteriores)
  if (laudos.length > 0) {
    const laudoLines = laudos.map(
      (l) =>
        `- ${l.tipo} (${l.data}): CID ${l.cid} — ${l.resumo}`
    )
    s.push(`## Laudos Anteriores\n${laudoLines.join('\n')}`)
  }

  if (data.infoAdicional) {
    s.push(`## Informações Adicionais\n${data.infoAdicional}`)
  }

  return s.join('\n\n')
}
