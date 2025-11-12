import { z } from 'zod'
import { createTool } from './create-tool'
import {
  MCPClient,
  type MCPServerConfig,
  type MCPToolSchema,
} from './mcp-client'
import type { Tool } from '../types'

/**
 * Convert MCP JSON Schema to Zod schema
 */
function jsonSchemaToZod(schema: any): z.ZodTypeAny {
  if (!schema || typeof schema !== 'object') {
    return z.any()
  }

  const type = schema.type

  switch (type) {
    case 'string':
      return z.string()
    case 'number':
      return z.number()
    case 'integer':
      return z.number().int()
    case 'boolean':
      return z.boolean()
    case 'array':
      if (schema.items) {
        return z.array(jsonSchemaToZod(schema.items))
      }
      return z.array(z.any())
    case 'object':
      if (schema.properties) {
        const shape: Record<string, z.ZodTypeAny> = {}
        for (const [key, value] of Object.entries(schema.properties)) {
          let fieldSchema = jsonSchemaToZod(value)

          // Make optional if not in required array
          if (!schema.required?.includes(key)) {
            fieldSchema = fieldSchema.optional()
          }

          shape[key] = fieldSchema
        }
        return z.object(shape)
      }
      return z.record(z.any())
    default:
      return z.any()
  }
}

// Store active MCP clients for cleanup
const activeMCPClients: MCPClient[] = []

// Cleanup function
const cleanupMCPClients = async () => {
  const clients = [...activeMCPClients]
  activeMCPClients.length = 0

  for (const client of clients) {
    try {
      await client.disconnect()
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Register cleanup handlers
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    cleanupMCPClients()
  })

  process.on('SIGINT', () => {
    cleanupMCPClients().then(() => process.exit(0))
  })

  process.on('SIGTERM', () => {
    cleanupMCPClients().then(() => process.exit(0))
  })
}

/**
 * Manually disconnect all active MCP clients
 * Useful for cleaning up in long-running applications
 *
 * @example
 * ```typescript
 * const tools = await createMCPTools({ ... })
 * // ... use tools ...
 * await disconnectAllMCPClients() // Clean up when done
 * ```
 */
export async function disconnectAllMCPClients(): Promise<void> {
  await cleanupMCPClients()
}

/**
 * Create Micro AI tools from an MCP server
 *
 * @param config - MCP server configuration
 * @param toolNames - Optional array of specific tool names to load (loads all if not specified)
 * @returns Promise resolving to array of Tool objects
 *
 * @example
 * ```typescript
 * // Load all tools from an MCP server
 * const tools = await createMCPTools({
 *   command: 'uvx',
 *   args: ['mcp-server-fetch']
 * })
 *
 * // Load specific tools only
 * const tools = await createMCPTools(
 *   { command: 'uvx', args: ['mcp-server-fetch'] },
 *   ['fetch']
 * )
 *
 * // Use with Micro client
 * const client = new Micro({
 *   model: 'openai:gpt-4.1-mini',
 *   tools
 * })
 * ```
 */
export async function createMCPTools(
  config: MCPServerConfig,
  toolNames?: string[]
): Promise<Tool[]> {
  const client = new MCPClient(config)

  try {
    await client.connect()
    const mcpTools = await client.listTools()

    // Filter tools if specific names provided
    const toolsToCreate = toolNames
      ? mcpTools.filter((tool) => toolNames.includes(tool.name))
      : mcpTools

    if (toolsToCreate.length === 0) {
      console.warn('[MCP] No tools found matching criteria')
      return []
    }

    // Convert each MCP tool to a Micro AI tool
    const tools = toolsToCreate.map((mcpTool: MCPToolSchema) => {
      const zodSchema = jsonSchemaToZod(mcpTool.inputSchema)

      return createTool(
        mcpTool.name,
        mcpTool.description || `MCP tool: ${mcpTool.name}`,
        zodSchema,
        async (args: any) => {
          try {
            const result = await client.callTool(mcpTool.name, args)
            return result
          } catch (error: any) {
            throw new Error(`MCP tool error: ${error.message}`)
          }
        }
      )
    })

    // Track client for cleanup
    activeMCPClients.push(client)

    return tools
  } catch (error: any) {
    await client.disconnect()
    throw new Error(`Failed to create MCP tools: ${error.message}`)
  }
}

/**
 * Create a single MCP tool
 *
 * @param config - MCP server configuration
 * @param toolName - Name of the specific tool to load
 * @returns Promise resolving to a Tool object
 *
 * @example
 * ```typescript
 * const fetchTool = await createMCPTool(
 *   { command: 'uvx', args: ['mcp-server-fetch'] },
 *   'fetch'
 * )
 * ```
 */
export async function createMCPTool(
  config: MCPServerConfig,
  toolName: string
): Promise<Tool> {
  const tools = await createMCPTools(config, [toolName])

  if (tools.length === 0) {
    throw new Error(`MCP tool "${toolName}" not found`)
  }

  return tools[0]!
}
