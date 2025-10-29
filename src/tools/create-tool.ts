import { type z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import type { Tool } from '../types'

/**
 * Creates a tool that can be used by agents to perform specific actions.
 *
 * @param name - The name of the tool
 * @param description - A description of what the tool does
 * @param schema - A trod schema defining the tool's parameters
 * @param executeFn - The function to execute when the tool is called
 * @returns A Tool object with schema and execute function
 *
 * @example
 * ```typescript
 * const weatherTool = createTool(
 *   "get_weather",
 *   "Get the current weather for a location",
 *   z.object({
 *     location: z.string().describe("The city and state, e.g. San Francisco, CA"),
 *     unit: z.enum(["celsius", "fahrenheit"]).optional()
 *   }),
 *   async (params) => {
 *     return `Weather in ${params.location}: 72°F, sunny`;
 *   }
 * );
 * ```
 */
export function createTool<T extends z.ZodTypeAny, R>(
  name: string,
  description: string,
  schema: T,
  executeFn: (params: z.infer<T>) => Promise<R> | R
): Tool {
  const jsonSchema = zodToJsonSchema(schema as any, {
    target: 'openApi3',
    $refStrategy: 'none',
  })

  const properties = (jsonSchema as any).properties || {}
  const required = (jsonSchema as any).required || []

  return {
    schema: {
      type: 'function',
      function: {
        name,
        description,
        parameters: {
          type: 'object',
          properties,
          required,
          additionalProperties: false,
        },
      },
    },
    execute: executeFn,
  }
}
