// frontend/app/api/b2b/[companyId]/action-plans/lib/invokeActionPlanAgent.ts

import type { GeneratedActionItem } from '~/agents/action-plan-generator/models/action-plan-generator.interface'
import { createActionPlanGraph } from '~/agents/action-plan-generator/services/action-plan-generator.graph'

const TAG = '[action-plan-agent]'

export async function buildAndInvokeActionPlanGraph(params: {
  companyId: string
  cycleId: string
  department: string | null
}): Promise<GeneratedActionItem[]> {
  const t0 = Date.now()
  console.warn(
    `${TAG} START company=${params.companyId} cycle=${params.cycleId} dept=${params.department ?? 'all'}`
  )

  const graph = createActionPlanGraph()

  const result = await graph.invoke({
    companyId: params.companyId,
    cycleId: params.cycleId,
    department: params.department ?? undefined,
    plans: [],
    status: 'pending',
    errors: [],
  })

  console.warn(
    `${TAG} DONE status=${result.status} plans=${result.plans?.length ?? 0} errors=${JSON.stringify(result.errors)} in ${Date.now() - t0}ms`
  )

  if (result.status === 'error') {
    throw new Error(result.errors.join('; '))
  }

  return result.plans
}
