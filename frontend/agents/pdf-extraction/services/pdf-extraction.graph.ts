// frontend/agents/pdf-extraction/services/pdf-extraction.graph.ts

import { END, START, StateGraph } from '@langchain/langgraph'

import { PdfExtractionState } from '../models/pdf-extraction.state'
import { extractData, parsePdf, validateOutput } from './pdf-extraction.nodes'

export function createPdfExtractionGraph() {
  const graph = new StateGraph(PdfExtractionState)
    .addNode('parsePdf', parsePdf)
    .addNode('extractData', extractData)
    .addNode('validateOutput', validateOutput)
    .addEdge(START, 'parsePdf')
    .addEdge('parsePdf', 'extractData')
    .addEdge('extractData', 'validateOutput')
    .addEdge('validateOutput', END)

  return graph.compile()
}
