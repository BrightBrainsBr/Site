// frontend/features/assessment/components/constants/scales/alsfrs.ts

import type { ScaleQuestion } from '../../assessment.interface'

export const ALSFRS_QUESTIONS: ScaleQuestion[] = [
  {
    q: 'Fala',
    o: [
      'Normal',
      'Distúrbio detectável',
      'Inteligível com repetição',
      'Fala + comunicação não-verbal',
      'Perda da fala',
    ],
  },
  {
    q: 'Salivação',
    o: ['Normal', 'Leve excesso', 'Moderado', 'Acentuado', 'Constante'],
  },
  {
    q: 'Deglutição',
    o: [
      'Normal',
      'Engasgos ocasionais',
      'Mudança na dieta',
      'Sonda suplementar',
      'Sonda exclusiva',
    ],
  },
  {
    q: 'Escrita',
    o: [
      'Normal',
      'Lenta, legível',
      'Nem tudo legível',
      'Segura caneta, não escreve',
      'Não segura caneta',
    ],
  },
  {
    q: 'Uso de utensílios',
    o: [
      'Normal',
      'Lento mas realiza',
      'Ajuda com botões',
      'Alguma ajuda',
      'Incapaz',
    ],
  },
  {
    q: 'Higiene',
    o: [
      'Normal',
      'Independente com esforço',
      'Assistência intermitente',
      'Necessita cuidador',
      'Dependência total',
    ],
  },
  {
    q: 'Virar na cama',
    o: [
      'Normal',
      'Lento sem ajuda',
      'Com dificuldade',
      'Inicia mas não completa',
      'Dependência total',
    ],
  },
  {
    q: 'Caminhar',
    o: [
      'Normal',
      'Dificuldade inicial',
      'Com assistência',
      'Movimento funcional apenas',
      'Sem movimento',
    ],
  },
  {
    q: 'Subir escadas',
    o: ['Normal', 'Lento', 'Instabilidade', 'Necessita assistência', 'Incapaz'],
  },
  {
    q: 'Dispneia',
    o: [
      'Nenhuma',
      'Ao caminhar',
      'Atividades diárias',
      'Em repouso',
      'Significativa',
    ],
  },
  {
    q: 'Ortopneia',
    o: [
      'Nenhuma',
      'Alguma dificuldade',
      'Travesseiros extras',
      'Só sentado',
      'Suporte ventilatório',
    ],
  },
  {
    q: 'Respiração',
    o: [
      'Nenhuma',
      'BiPAP intermitente',
      'BiPAP noturno',
      'BiPAP contínuo',
      'Ventilação invasiva',
    ],
  },
]
