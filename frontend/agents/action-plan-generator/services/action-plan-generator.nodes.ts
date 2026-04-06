// frontend/agents/action-plan-generator/services/action-plan-generator.nodes.ts

import { z } from 'zod'

import { AgentError } from '~/agents/shared/errors'
import {
  getAnthropicConfigForTask,
  llmService,
} from '~/shared/utils/llm/services/llmService'

import type { GeneratedActionItem } from '../models/action-plan-generator.interface'
import type { ActionPlanStateType } from '../models/action-plan-generator.state'
import {
  ACTION_PLAN_SYSTEM,
  buildGroContextMessage,
} from '../prompts/action-plan-generator.prompts'
import { fetchGroAggregation } from './action-plan-generator.storage'

const actionPlanSchema = z.object({
  plans: z.array(
    z.object({
      description: z.string(),
      department: z.string().optional(),
      priority: z.enum(['alta', 'media', 'baixa']),
      responsible: z.string().optional(),
      deadline: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
})

export async function loadGroData(
  state: ActionPlanStateType
): Promise<Partial<ActionPlanStateType>> {
  try {
    const groContext = await fetchGroAggregation(
      state.companyId,
      state.cycleId,
      state.department
    )

    // When there are no evaluations yet, generate a baseline action plan
    // based on NR-1 requirements instead of failing
    return { groContext }
  } catch (err) {
    throw new AgentError(
      `Failed to load GRO data: ${err instanceof Error ? err.message : String(err)}`,
      'loadGroData',
      err
    )
  }
}

export async function generatePlans(
  state: ActionPlanStateType
): Promise<Partial<ActionPlanStateType>> {
  if (!state.groContext) {
    return {
      status: 'error',
      errors: [...state.errors, 'GRO context not available'],
    }
  }

  const config = getAnthropicConfigForTask('general_response', {
    max_tokens: 4096,
  })

  try {
    const { result } = await llmService.invokeStructuredOutput({
      promptMessages: [
        { role: 'system', content: ACTION_PLAN_SYSTEM },
        {
          role: 'human',
          content: buildGroContextMessage(state.groContext, state.department),
        },
      ],
      outputSchema: actionPlanSchema,
      primaryConfigDict: config,
      fixerConfigDict: getAnthropicConfigForTask('general_response'),
      stepName: 'action_plan_generation',
    })

    return {
      plans: result.plans as GeneratedActionItem[],
      status: 'completed',
    }
  } catch (err) {
    throw new AgentError(
      `LLM plan generation failed: ${err instanceof Error ? err.message : String(err)}`,
      'generatePlans',
      err
    )
  }
}
