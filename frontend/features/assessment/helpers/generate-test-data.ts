import type { AssessmentFormData } from '../components/assessment.interface'
import { INITIAL_FORM_DATA } from '../components/assessment.interface'
import { FAMILY_CONDITIONS } from '../components/constants/medical-options'
import { SYMPTOM_CATEGORIES } from '../components/constants/symptom-categories'

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: readonly T[], min: number, max: number): T[] {
  const n = Math.floor(Math.random() * (max - min + 1)) + min
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randScale(length: number, max: number): number[] {
  return Array.from({ length }, () => randInt(0, max))
}

// AEP has exactly 14 questions (Likert 0-4)
// SRQ-20 has 20 questions (binary 0-1)
// canal_percepcao values must match CanalPercepcaoStep constants exactly

export function generateB2BTestFormData(): AssessmentFormData {
  return {
    ...INITIAL_FORM_DATA,

    nome: pick(['Ana Lima', 'Carlos Mendes', 'Fernanda Costa', 'Rafael Souza']),
    nascimento: pick(['1985-03-12', '1990-07-24', '1978-11-05', '1995-02-18']),
    cpf: '999.999.999-99',
    telefone: '(11) 99999-0000',
    email: 'colaborador.teste@empresa.com',
    sexo: pick(['masculino', 'feminino']),
    profissao: pick(['Analista', 'Coordenador', 'Assistente', 'Gerente']),
    escolaridade: pick(['sup_comp', 'pos']),

    publico: 'adulto',

    // SRQ-20: 20 binary answers (0 = Não, 1 = Sim)
    srq20_answers: Array.from({ length: 20 }, () => randInt(0, 1)),

    // Clinical scales required for NR-1 GRO dashboard
    phq9: randScale(9, 3),   // PHQ-9: depression (0-27)
    gad7: randScale(7, 3),   // GAD-7: anxiety (0-21)
    pss10: randScale(10, 4), // PSS-10: perceived stress (0-40)
    mbi: randScale(16, 6),   // MBI-EE: burnout (0-96)
    isi: randScale(7, 4),    // ISI: insomnia severity (0-28)

    // AEP: exactly 14 questions, Likert 0-4
    aep_answers: Array.from({ length: 14 }, () => randInt(1, 4)),
    aep_percepcao_livre: pick([
      'Sinto que as demandas de trabalho têm aumentado muito e não tenho tempo para pausas adequadas.',
      'A comunicação com a liderança poderia melhorar. Às vezes me sinto sobrecarregado.',
      'De modo geral estou bem, mas as metas mensais criam bastante pressão.',
    ]),

    // canal_percepcao values must match CanalPercepcaoStep constants exactly:
    // urgencia: 'urgente' | 'registro'
    // tipo: 'estresse' | 'sobrecarga' | 'assedio_moral' | 'assedio_sexual' | 'conflito' | 'condicoes_fisicas' | 'falta_recursos' | 'discriminacao' | 'outro'
    // frequencia: 'isolado' | 'recorrente' | 'continuo'
    // impacto: 'baixo' | 'moderado' | 'alto' | 'critico'
    // setor: 'outro' is always available; real departments from company context
    canal_percepcao: {
      urgencia: pick(['urgente', 'registro'] as const),
      tipo: pick(['estresse', 'sobrecarga', 'conflito', 'falta_recursos'] as const),
      frequencia: pick(['isolado', 'recorrente', 'continuo'] as const),
      setor: 'outro',
      impacto: pick(['baixo', 'moderado', 'alto', 'critico'] as const),
      descricao: pick([
        'Pressão constante para bater metas sem suporte adequado.',
        'Dificuldade em conciliar demandas de múltiplos projetos ao mesmo tempo.',
        'Sobrecarga de reuniões que afeta a produtividade.',
      ]),
      sugestao: pick([
        'Implementar pausas ativas no meio do expediente.',
        'Reduzir número de reuniões diárias.',
        'Mais treinamentos sobre gestão do estresse.',
      ]),
    },

    // NR-1 Perfil
    nr1_role: pick(['Analista', 'Coordenador', 'Assistente', 'Técnico']),
    nr1_work_time: pick(['< 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', '> 10 anos']),

    // NR-1 Físico (Likert 1-5)
    noise_level: randInt(1, 5),
    temperature_level: randInt(1, 5),
    lighting_level: randInt(1, 5),
    vibration_level: randInt(1, 5),
    humidity_level: randInt(1, 5),

    // NR-1 Químico
    chemical_exposures: pickN(['Solventes', 'Tintas/Vernizes', 'Pó/Particulados', 'Gases tóxicos'] as const, 0, 2) as string[],
    chemical_details: pick(['Exposição leve a solventes de limpeza', '', '']),

    // NR-1 Biológico
    biological_exposures: pickN(['Bactérias', 'Vírus', 'Fungos'] as const, 0, 1) as string[],
    biological_details: '',

    // NR-1 Ergonômico (Likert 1-5)
    posture_level: randInt(1, 4),
    repetition_level: randInt(1, 4),
    manual_force_level: randInt(1, 3),
    breaks_level: randInt(1, 4),
    screen_level: randInt(2, 5),
    mobility_level: randInt(1, 4),
    cognitive_effort_level: randInt(2, 5),

    // NR-1 Psicossocial (Likert 1-5)
    workload_level: randInt(1, 4),
    pace_level: randInt(1, 4),
    autonomy_level: randInt(1, 3),
    leadership_level: randInt(1, 3),
    relationships_level: randInt(1, 3),
    recognition_level: randInt(1, 4),
    clarity_level: randInt(1, 3),
    balance_level: randInt(1, 4),
    violence_level: randInt(1, 2),
    harassment_level: randInt(1, 2),

    // NR-1 Acidentes
    had_accident: pick([true, false]),
    accident_description: pick(['Queda na escada do estoque', '', '']),
    had_near_miss: pick([true, false]),
    near_miss_description: '',
    had_work_disease: false,
    work_disease_description: '',

    // NR-1 Percepção
    satisfaction_level: randInt(2, 5),
    biggest_risk: pick(['Piso escorregadio', 'Iluminação insuficiente', 'Ruído excessivo', '']),
    suggestion: pick(['Instalar piso antiderrapante', 'Melhorar a ventilação', '']),

    // LGPD consent
    lgpd_consent: true,

    b2b_anonymized_consent: true,
    b2c_consent: pick([true, false]),
    b2c_contact_consent: false,
  }
}

export function generateTestFormData(): AssessmentFormData {
  const allSymptoms = SYMPTOM_CATEGORIES.flatMap((c) => c.items)

  return {
    ...INITIAL_FORM_DATA,

    nome: 'Paciente Teste Silva',
    nascimento: '1988-06-15',
    cpf: '123.456.789-00',
    telefone: '(11) 98765-4321',
    email: 'teste@brightbrains.com',
    sexo: pick(['masculino', 'feminino']),
    profissao: pick(['Engenheiro', 'Médico', 'Professor', 'Advogado']),
    escolaridade: pick(['sup_comp', 'pos', 'mestrado']),
    peso: String(randInt(55, 95)),
    altura: String(randInt(155, 190)),

    publico: 'adulto',
    queixaPrincipal:
      'Dificuldade de concentração, insônia frequente e ansiedade persistente nos últimos meses. Fadiga crônica e dificuldade em manter foco.',
    tempoSintomas: 'Aproximadamente 8 meses, com piora nos últimos 3.',
    eventoDesencadeador:
      'Mudança de emprego e aumento significativo da carga de trabalho.',

    diagAnterior: 'sim',
    diagAnterioresDetalhe:
      'Transtorno de Ansiedade Generalizada (F41.1), TDAH (F90.0)',
    psicoterapia: 'sim',
    internacao: 'nao',
    condicoesCronicas: pickN(
      ['Enxaqueca crônica', 'Hipotireoidismo', 'Hipertensão'],
      1,
      2
    ),
    examesNeuro: 'sim',
    examesNeuroDetalhe:
      'EEG realizado em 2024, RM de crânio sem alterações significativas.',

    sintomasAtuais: pickN(allSymptoms, 5, 10),
    outrosSintomas: '',

    // Scales — 0-3 for most, 0-4 for some
    phq9: randScale(9, 3),
    gad7: randScale(7, 3),
    isi: randScale(7, 4),
    asrs: randScale(6, 4),
    aq10: randScale(10, 3),
    ocir: randScale(18, 4),
    pcl5: randScale(8, 4),
    mdq: randScale(13, 1),
    mbi: randScale(16, 6),
    pss10: randScale(10, 4),
    spin: randScale(3, 4),
    auditc: randScale(3, 4),
    ad8: randScale(8, 1),
    nms: randScale(15, 1),
    alsfrs: randScale(12, 4),
    snapiv: randScale(18, 3),

    mdqSimultaneo: pick(['sim', 'nao']),
    mdqImpacto: pick(['nenhum', 'pouco', 'moderado', 'grave']),

    usaMedicamento: 'sim',
    medPassado: 'sim',
    medPassadoDetalhe: 'Sertralina 50mg por 6 meses, descontinuado em 2023.',
    efeitosAdversos: 'Náusea leve com sertralina anterior.',
    alergias: 'Nenhuma alergia conhecida.',
    medicamentos: [
      { nome: 'Escitalopram', dose: '10mg', tempo: '3 meses' },
      { nome: 'Melatonina', dose: '3mg', tempo: '2 meses' },
    ],

    suplementos: [
      { nome: 'Magnésio Dimalato', dose: '300mg' },
      { nome: 'Ômega-3', dose: '1000mg' },
    ],
    supObs: '',

    uploads: {},

    possuiLaudos: 'sim',
    laudosAnteriores: [
      {
        tipo: 'Laudo Psiquiátrico',
        data: '2024-08',
        cid: 'F41.1',
        resumo: 'TAG moderado, início de tratamento farmacológico.',
      },
    ],

    usaWearable: 'nao',
    wDispositivo: '',
    wFCRepouso: '',
    wHRV: '',
    wSonoDuracao: '',
    wPassos: '',
    wEstresse: '',
    wearableObs: '',

    estadoCivil: pick(['Casado(a)', 'Solteiro(a)', 'União estável']),
    satisfacaoRelacionamento: pick(['Satisfeito', 'Neutro']),
    situacaoProfissional: pick(['clt', 'autonomo']),
    cargaHoraria: pick(['40-50h', '50-60h']),
    horaDormir: pick(['23:00', '00:00', '01:00']),
    horaAcordar: pick(['06:00', '07:00', '08:00']),
    qualidadeSono: pick(['Regular', 'Ruim']),
    atividadeFisica: pick(['1-2x/sem', '3-4x/sem', 'Não pratico']),
    cafeina: pick(['1-2/dia', '3-4/dia']),
    tabaco: 'Nunca',
    cannabis: 'Nunca',
    neuromod: 'Nunca',
    neuromodDetalhes: '',
    estresse: pick(['Alto', 'Moderado']),
    redeApoio: pick(['Moderada', 'Forte']),
    fontesEstresse: pickN(['Trabalho', 'Financeiro', 'Saúde', 'Família'], 2, 3),
    estiloVidaObs: '',

    familiaCondicoes: pickN(FAMILY_CONDITIONS, 2, 4),
    familiaDetalhes: 'Mãe com depressão, tio paterno com TDAH.',
    infoAdicional: '',
  }
}
