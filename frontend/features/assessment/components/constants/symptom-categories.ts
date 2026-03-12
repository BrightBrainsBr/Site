// frontend/features/assessment/components/constants/symptom-categories.ts

export interface SymptomCategory {
  title: string
  items: string[]
}

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    title: 'Humor',
    items: [
      'Tristeza persistente',
      'Anedonia',
      'Irritabilidade',
      'Choro fácil',
      'Euforia',
    ],
  },
  {
    title: 'Ansiedade',
    items: [
      'Preocupação excessiva',
      'Inquietação',
      'Tensão muscular',
      'Pânico',
      'Pensamentos obsessivos',
      'Rituais compulsivos',
    ],
  },
  {
    title: 'Cognição',
    items: [
      'Dificuldade de concentração',
      'Esquecimentos',
      'Brain fog',
      'Hiperatividade mental',
      'Desorganização',
    ],
  },
  {
    title: 'Sono',
    items: [
      'Insônia inicial',
      'Despertar noturno',
      'Despertar precoce',
      'Sonolência diurna',
      'Pesadelos',
    ],
  },
  {
    title: 'Comportamento',
    items: [
      'Isolamento social',
      'Dificuldade social',
      'Comportamentos repetitivos',
      'Rigidez com rotinas',
      'Impulsividade',
    ],
  },
  {
    title: 'Motor/Neurológico',
    items: [
      'Tremor',
      'Rigidez muscular',
      'Lentidão motora',
      'Problemas de equilíbrio',
      'Fraqueza muscular',
      'Fasciculações',
      'Alteração na marcha',
      'Alteração na caligrafia',
    ],
  },
  {
    title: 'Físicos',
    items: [
      'Fadiga',
      'Cefaleia',
      'Dores',
      'GI',
      'Alt. apetite',
      'Palpitações',
      'Alt. olfato',
    ],
  },
]
