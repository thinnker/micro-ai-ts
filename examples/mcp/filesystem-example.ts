/**
 * MCP Filesystem Tool Example
 *
 * This example shows how to use the MCP filesystem server
 * to give AI access to read files.
 *
 * Prerequisites:
 * - Install uv/uvx: https://docs.astral.sh/uv/getting-started/installation/
 * - Set OPENAI_API_KEY in .env
 *
 * Run: pnpm check:example examples/mcp/filesystem-example.ts
 */

import { Micro, createMCPTools } from '../../src/index'
import path from 'path'

async function main() {
  console.log('🚀 Loading MCP filesystem tools...\n')

  // Get the project root directory
  const projectRoot = path.resolve(process.cwd())

  // Create tools from MCP filesystem server
  // This gives AI read-only access to the project directory
  const mcpTools = await createMCPTools({
    command: 'uvx',
    args: ['mcp-server-filesystem', projectRoot],
  })

  console.log(`✅ Loaded ${mcpTools.length} MCP tool(s)`)
  console.log(
    `   Tools: ${mcpTools.map((t) => t.schema.function.name).join(', ')}`
  )
  console.log(`   Allowed directory: ${projectRoot}\n`)

  // Create Micro client with MCP tools
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    tools: mcpTools,
    onToolCall: (toolResponse) => {
      console.log(`🔧 Tool called: ${toolResponse.toolName}`)
      console.log(`   Arguments:`, toolResponse.arguments)
    },
  })

  // Test the MCP filesystem tools
  console.log('💬 Asking AI to read package.json...\n')

  const response = await client.chat(
    'Read the package.json file and tell me the project name and version'
  )

  console.log('🤖 Response:', response.completion.content)
  console.log('\n📊 Metadata:')
  console.log(`   Model: ${response.metadata.model}`)
  console.log(`   Tokens: ${response.metadata.tokensUsed?.total_tokens}`)
  console.log(`   Latency: ${response.metadata.timing.latencyMs}ms`)
}

main().catch(console.error)
