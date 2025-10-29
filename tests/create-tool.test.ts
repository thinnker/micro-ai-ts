import { describe, it, expect } from 'vitest'
import { createTool } from '../src/tools/create-tool'
import { z } from 'zod'

describe('createTool', () => {
  it('should create a tool with correct schema structure', () => {
    const tool = createTool(
      'test_tool',
      'A test tool',
      z.object({
        param1: z.string(),
      }),
      async (params) => params.param1
    )

    expect(tool.schema.type).toBe('function')
    expect(tool.schema.function.name).toBe('test_tool')
    expect(tool.schema.function.description).toBe('A test tool')
    expect(tool.schema.function.parameters.type).toBe('object')
    expect(tool.schema.function.parameters.additionalProperties).toBe(false)
  })

  it('should convert zod schema to JSON schema properties', () => {
    const tool = createTool(
      'calculator',
      'Performs calculations',
      z.object({
        operation: z.enum(['add', 'subtract']),
        a: z.number(),
        b: z.number(),
      }),
      async (params) => params.a + params.b
    )

    const properties = tool.schema.function.parameters.properties
    expect(properties).toBeDefined()
    expect(properties?.operation).toBeDefined()
    expect(properties?.a).toBeDefined()
    expect(properties?.b).toBeDefined()
  })

  it('should mark required fields correctly', () => {
    const tool = createTool(
      'test_tool',
      'Test',
      z.object({
        required: z.string(),
        optional: z.string().optional(),
      }),
      async () => 'result'
    )

    const required = tool.schema.function.parameters.required
    expect(required).toContain('required')
    expect(required).not.toContain('optional')
  })

  it('should execute synchronous functions', async () => {
    const tool = createTool(
      'sync_tool',
      'Sync test',
      z.object({ value: z.string() }),
      (params) => `Result: ${params.value}`
    )

    const result = await tool.execute({ value: 'test' })
    expect(result).toBe('Result: test')
  })

  it('should execute async functions', async () => {
    const tool = createTool(
      'async_tool',
      'Async test',
      z.object({ value: z.number() }),
      async (params) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(params.value * 2), 10)
        })
      }
    )

    const result = await tool.execute({ value: 5 })
    expect(result).toBe(10)
  })

  it('should handle complex nested schemas', () => {
    const tool = createTool(
      'complex_tool',
      'Complex test',
      z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
        tags: z.array(z.string()),
      }),
      async (params) => params
    )

    const properties = tool.schema.function.parameters.properties
    expect(properties?.user).toBeDefined()
    expect(properties?.tags).toBeDefined()
  })

  it('should handle enum types', () => {
    const tool = createTool(
      'enum_tool',
      'Enum test',
      z.object({
        status: z.enum(['active', 'inactive', 'pending']),
      }),
      async (params) => params.status
    )

    const properties = tool.schema.function.parameters.properties
    expect(properties?.status).toBeDefined()
  })

  it('should preserve parameter descriptions', () => {
    const tool = createTool(
      'described_tool',
      'Tool with descriptions',
      z.object({
        location: z.string().describe('The city and state'),
        unit: z.enum(['celsius', 'fahrenheit']).describe('Temperature unit'),
      }),
      async () => 'result'
    )

    const properties = tool.schema.function.parameters.properties
    expect(properties?.location?.description).toBe('The city and state')
    expect(properties?.unit?.description).toBe('Temperature unit')
  })

  it('should handle tools that return objects', async () => {
    const tool = createTool(
      'object_tool',
      'Returns object',
      z.object({ id: z.string() }),
      async (params) => ({
        id: params.id,
        timestamp: Date.now(),
        status: 'success',
      })
    )

    const result = await tool.execute({ id: 'test-123' })
    expect(result).toHaveProperty('id', 'test-123')
    expect(result).toHaveProperty('timestamp')
    expect(result).toHaveProperty('status', 'success')
  })

  it('should handle tools with no parameters', () => {
    const tool = createTool(
      'no_params_tool',
      'No parameters',
      z.object({}),
      async () => 'constant result'
    )

    expect(tool.schema.function.parameters.properties).toEqual({})
    expect(tool.schema.function.parameters.required).toEqual([])
  })
})
