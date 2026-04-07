/**
 * Smoke test: invoke Anthropic with structured output.
 * Run: npx tsx features/llm/__test__/smoke.ts
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { z } from 'zod'

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

import { llmService, LLMProvider } from '../index'

const CitySchema = z.object({
  city: z.string(),
  country: z.string(),
  population: z.number(),
  funFact: z.string(),
})

const anthropicConfig = {
  provider: LLMProvider.ANTHROPIC,
  model_name: 'claude-sonnet-4-20250514',
  temperature: 0,
}

const fixerConfig = {
  provider: LLMProvider.ANTHROPIC,
  model_name: 'claude-haiku-4-20250514',
  temperature: 0,
}

async function testBasicStructuredOutput() {
  console.log('\n--- Test 1: Anthropic structured output ---')
  const { result, modelUsed } = await llmService.invokeStructuredOutput({
    promptMessages: [
      { role: 'system', content: 'You return structured JSON about cities.' },
      {
        role: 'human',
        content:
          'Tell me about Tokyo. Return JSON with city, country, population (number), and funFact.',
      },
    ],
    outputSchema: CitySchema,
    primaryConfigDict: anthropicConfig,
    fixerConfigDict: fixerConfig,
    stepName: 'test_anthropic',
  })

  console.log('SUCCESS! Model used:', modelUsed)
  console.log('Result:', JSON.stringify(result, null, 2))
  const valid = CitySchema.safeParse(result)
  console.log('Schema valid:', valid.success)
  if (!valid.success) throw new Error('Schema validation failed!')
}

const CompanyListSchema = z.object({
  companies: z.array(
    z.object({
      name: z.string(),
      industry: z.string(),
      yearFounded: z.number(),
    })
  ),
})

async function testComplexSchema() {
  console.log('\n--- Test 2: Complex nested schema ---')
  const { result, modelUsed } = await llmService.invokeStructuredOutput({
    promptMessages: [
      {
        role: 'human',
        content:
          'List 3 famous tech companies. Return JSON with companies array, each having name, industry, yearFounded.',
      },
    ],
    outputSchema: CompanyListSchema,
    primaryConfigDict: anthropicConfig,
    fixerConfigDict: fixerConfig,
    stepName: 'test_complex_schema',
  })

  console.log('SUCCESS! Model used:', modelUsed)
  console.log('Result:', JSON.stringify(result, null, 2))
  console.log('Companies count:', result.companies.length)
  const valid = CompanyListSchema.safeParse(result)
  console.log('Schema valid:', valid.success)
  if (!valid.success) throw new Error('Schema validation failed!')
}

async function testFallback() {
  console.log('\n--- Test 3: Fallback (bad primary -> Anthropic fallback) ---')
  const { result, modelUsed } = await llmService.invokeStructuredOutput({
    promptMessages: [
      { role: 'human', content: 'Tell me about Berlin. Return JSON with city, country, population, funFact.' },
    ],
    outputSchema: CitySchema,
    primaryConfigDict: {
      provider: LLMProvider.ANTHROPIC,
      model_name: 'claude-sonnet-4-20250514',
      api_key: 'sk-ant-INVALID-KEY-12345',
    },
    fallbackConfigDict: anthropicConfig,
    fixerConfigDict: fixerConfig,
    stepName: 'test_fallback',
  })

  console.log('SUCCESS via fallback! Model used:', modelUsed)
  console.log('Result:', JSON.stringify(result, null, 2))
  const valid = CitySchema.safeParse(result)
  console.log('Schema valid:', valid.success)
  if (!valid.success) throw new Error('Schema validation failed!')
}

async function main() {
  console.log('\n=== LLM Service Smoke Test ===')
  console.log('ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY)

  let passed = 0
  let failed = 0

  for (const test of [testBasicStructuredOutput, testComplexSchema, testFallback]) {
    try {
      await test()
      passed++
    } catch (err) {
      failed++
      console.error('FAILED:', err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(console.error)
