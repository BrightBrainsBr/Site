// frontend/app/api/b2b/[companyId]/action-plans/lib/invokeActionPlanAgent.ts

import type { GeneratedActionItem } from '~/agents/action-plan-generator/models/action-plan-generator.interface'
import { createActionPlanGraph } from '~/agents/action-plan-generator/services/action-plan-generator.graph'

export async function buildAndInvokeActionPlanGraph(params: {
  companyId: string
  cycleId: string
  department: string | null
}): Promise<GeneratedActionItem[]> {
  const graph = createActionPlanGraph()

  const result = await graph.invoke({
    companyId: params.companyId,
    cycleId: params.cycleId,
    department: params.department ?? undefined,
    plans: [],
    status: 'pending',
    errors: [],
  })

  if (result.status === 'error') {
    throw new Error(result.errors.join('; '))
  }

  return result.plans
}
