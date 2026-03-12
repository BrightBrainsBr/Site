// frontend/features/assessment/components/constants/scales/auditc.ts

import type { ScaleQuestion } from '../../assessment.interface'

export const AUDITC_QUESTIONS: ScaleQuestion[] = [
  {
    q: 'Frequência de consumo de álcool',
    o: ['Nunca', 'Mensal ou menos', '2-4x/mês', '2-3x/semana', '4+/semana'],
  },
  { q: 'Doses típicas quando bebe', o: ['1-2', '3-4', '5-6', '7-9', '10+'] },
  {
    q: 'Frequência de 6+ doses na ocasião',
    o: ['Nunca', 'Menos que mensal', 'Mensal', 'Semanal', 'Diário'],
  },
]
