// frontend/agents/b2b-laudo/services/b2b-laudo.graph.ts

import { END, START, StateGraph } from '@langchain/langgraph'

import { B2BLaudoAnnotation } from '../models/b2b-laudo.state'
import {
  buildPdf,
  generateText,
  loadContext,
  storeResult,
} from './b2b-laudo.nodes'

const graph = new StateGraph(B2BLaudoAnnotation)
  .addNode('loadContext', loadContext, { retryPolicy: { maxAttempts: 2 } })
  .addNode('generateText', generateText, { retryPolicy: { maxAttempts: 3 } })
  .addNode('buildPdf', buildPdf)
  .addNode('storeResult', storeResult, { retryPolicy: { maxAttempts: 2 } })
  .addEdge(START, 'loadContext')
  .addConditionalEdges('loadContext', (state) =>
    state.errors.length > 0 ? '__end__' : 'generateText'
  )
  .addConditionalEdges('generateText', (state) =>
    state.errors.length > 0 ? '__end__' : 'buildPdf'
  )
  .addConditionalEdges('buildPdf', (state) =>
    state.errors.length > 0 ? '__end__' : 'storeResult'
  )
  .addEdge('storeResult', END)

export const b2bLaudoGraph = graph.compile()
