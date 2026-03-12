// frontend/features/assessment/components/constants/scales/ocir.ts

import type { ScaleOption } from '../../assessment.interface'

export const OCIR_QUESTIONS: string[] = [
  'Verifico as coisas mais do que necessário',
  'Pensamentos desagradáveis contra minha vontade',
  'Se não fizer certas coisas, algo ruim acontece',
  'Lavo e limpo obsessivamente',
  'Dificuldade em controlar pensamentos',
  'Acumulo coisas',
  'Verifico repetidamente portas, janelas',
  'Angústia com pensamentos desagradáveis',
  'Obrigação de contar',
  'Medo de tocar objetos de estranhos',
  'Necessidade de organização específica',
  'Necessidade de repetir números',
  'Lavo-me por sentir contaminação',
  'Pensamentos de natureza agressiva',
  'Perturbação se objetos fora de ordem',
  'Dificuldade em tocar lixo',
  'Coisas em determinada ordem',
  'Verifico torneiras e interruptores repetidamente',
]

export const OCIR_OPTIONS: ScaleOption[] = [
  { label: 'Nada', value: 0 },
  { label: 'Um pouco', value: 1 },
  { label: 'Moderadamente', value: 2 },
  { label: 'Muito', value: 3 },
  { label: 'Extremamente', value: 4 },
]
