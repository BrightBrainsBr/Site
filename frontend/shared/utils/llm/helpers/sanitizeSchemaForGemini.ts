// frontend/features/llm/helpers/sanitizeSchemaForGemini.ts

const GEMINI_UNSUPPORTED_SCHEMA_KEYS = new Set([
  'additionalProperties',
  '$defs',
  'title',
  'default',
])

type JsonSchemaNode = Record<string, unknown>

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function resolveArray(
  defs: Record<string, JsonSchemaNode>,
  arr: unknown[]
): unknown[] {
  return arr.map((item) =>
    isObj(item) ? resolveNode(defs, item, false) : item
  )
}

function resolveRef(
  defs: Record<string, JsonSchemaNode>,
  dict: JsonSchemaNode
): JsonSchemaNode {
  const refName = (dict.$ref as string).split('/').pop() ?? ''
  if (!(refName in defs)) return dict

  const resolved = resolveNode(
    defs,
    { ...defs[refName] },
    false
  ) as JsonSchemaNode
  for (const [k, v] of Object.entries(dict)) {
    if (k !== '$ref') resolved[k] = v
  }
  return resolved
}

function cleanDict(
  defs: Record<string, JsonSchemaNode>,
  dict: JsonSchemaNode,
  isProperties: boolean
): JsonSchemaNode {
  const cleaned: JsonSchemaNode = {}

  for (const [key, value] of Object.entries(dict)) {
    if (!isProperties && GEMINI_UNSUPPORTED_SCHEMA_KEYS.has(key)) continue

    if (key === 'properties' && isObj(value)) {
      cleaned[key] = resolveNode(defs, value, true)
    } else if (isObj(value)) {
      cleaned[key] = resolveNode(defs, value, false)
    } else if (Array.isArray(value)) {
      cleaned[key] = resolveArray(defs, value)
    } else {
      cleaned[key] = value
    }
  }

  return cleaned
}

function resolveNode(
  defs: Record<string, JsonSchemaNode>,
  node: unknown,
  isProperties: boolean
): unknown {
  if (!isObj(node)) return node
  if (Array.isArray(node)) return resolveArray(defs, node)

  const dict = node as JsonSchemaNode

  if ('$ref' in dict && typeof dict.$ref === 'string') {
    return resolveRef(defs, dict)
  }

  return cleanDict(defs, dict, isProperties)
}

/**
 * Recursively strip keys that Gemini's response_schema does not support
 * (additionalProperties, $defs, title, default). Also inline any $ref
 * pointers using the top-level $defs before removing $defs itself.
 *
 * Keys inside "properties" dicts are actual property names and
 * must NOT be stripped even if they collide with metadata key names.
 */
export function sanitizeSchemaForGemini(
  schema: JsonSchemaNode
): JsonSchemaNode {
  const defs = (schema.$defs ?? schema.definitions ?? {}) as Record<
    string,
    JsonSchemaNode
  >
  return resolveNode(defs, schema, false) as JsonSchemaNode
}
