// frontend/agents/action-plan-generator/models/action-plan-generator.interface.ts

export interface GROContext {
  scaleAverages: Record<string, number>
  aepDimensions: Record<string, number>
  srq20Distribution: {
    negative: number
    moderate: number
    elevated: number
    critical: number
  }
  totalEvaluations: number
  departments: string[]
}

export interface GeneratedActionItem {
  description: string
  department?: string
  priority: 'alta' | 'media' | 'baixa'
  responsible?: string
  deadline?: string
  notes?: string
}
