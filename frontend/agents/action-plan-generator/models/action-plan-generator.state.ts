// frontend/agents/action-plan-generator/models/action-plan-generator.state.ts

import { Annotation } from '@langchain/langgraph'

import type {
  GeneratedActionItem,
  GROContext,
} from './action-plan-generator.interface'

export const ActionPlanState = Annotation.Root({
  companyId: Annotation<string>,
  cycleId: Annotation<string>,
  department: Annotation<string | undefined>,
  groContext: Annotation<GROContext | undefined>,
  plans: Annotation<GeneratedActionItem[]>,
  status: Annotation<'pending' | 'completed' | 'error'>,
  errors: Annotation<string[]>,
})

export type ActionPlanStateType = typeof ActionPlanState.State
