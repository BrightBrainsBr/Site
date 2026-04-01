// frontend/agents/action-plan-generator/services/action-plan-generator.graph.ts

import { END, START, StateGraph } from '@langchain/langgraph'

import { ActionPlanState } from '../models/action-plan-generator.state'
import { generatePlans, loadGroData } from './action-plan-generator.nodes'

export function createActionPlanGraph() {
  const graph = new StateGraph(ActionPlanState)
    .addNode('loadGroData', loadGroData)
    .addNode('generatePlans', generatePlans)
    .addEdge(START, 'loadGroData')
    .addConditionalEdges('loadGroData', (state) => {
      if (state.status === 'error') return END
      return 'generatePlans'
    })
    .addEdge('generatePlans', END)

  return graph.compile()
}
