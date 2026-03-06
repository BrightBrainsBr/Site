// frontend/components/assessment/constants/scales/isi.ts

import type { ScaleQuestion } from '../../assessment.interface'

export const ISI_QUESTIONS: ScaleQuestion[] = [
  {
    q: 'Dificuldade para pegar no sono',
    o: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    q: 'Dificuldade para permanecer dormindo',
    o: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    q: 'Problema de despertar muito cedo',
    o: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    q: 'Satisfação com seu padrão de sono atual',
    o: [
      'Muito satisfeito',
      'Satisfeito',
      'Moderado',
      'Insatisfeito',
      'Muito insatisfeito',
    ],
  },
  {
    q: 'Interferência do sono no funcionamento diário',
    o: ['Não interfere', 'Um pouco', 'Razoavelmente', 'Muito', 'Muitíssimo'],
  },
  {
    q: 'Percepção de outros sobre seu problema de sono',
    o: ['Nada perceptível', 'Um pouco', 'Razoavelmente', 'Muito', 'Muitíssimo'],
  },
  {
    q: 'Preocupação com seu problema de sono',
    o: ['Nada', 'Um pouco', 'Razoavelmente', 'Muito', 'Muitíssimo'],
  },
]
