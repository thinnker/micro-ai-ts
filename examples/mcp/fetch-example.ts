/**
 * MCP Fetch Tool Example
 *
 * This example demonstrates how to use MCP servers as tools in Micro AI.
 * It uses the mcp-server-fetch to fetch web content.
 *
 * Prerequisites:
 * - Install uv/uvx: https://docs.astral.sh/uv/getting-started/installation/
 * - Set OPENAI_API_KEY in .env
 *
 * Run: pnpm check:example examples/mcp/fetch-example.ts
 */

import { Micro, createMCPTools, disconnectAllMCPClients } from '../../src/index'

async function main() {
  console.log('🚀 Loading MCP fetch tool...\n')

  // Create tools from MCP server
  const mcpTools = await createMCPTools({
    command: 'uvx',
    args: ['mcp-server-fetch'],
  })

  console.log(`✅ Loaded ${mcpTools.length} MCP tool(s)`)
  console.log(
    `   Tools: ${mcpTools.map((t) => t.schema.function.name).join(', ')}\n`
  )

  // Create Micro client with MCP tools
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    tools: mcpTools,
    onToolCall: (toolResponse) => {
      console.log(`🔧 Tool called: ${toolResponse.toolName}`)
      console.log(`   Arguments:`, toolResponse.arguments)
      console.log(
        `   Result preview: ${String(toolResponse.result).substring(0, 100)}...\n`
      )
    },
  })

  // Test the MCP tool
  console.log('💬 Asking AI to fetch a webpage...\n')

  const response = await client.chat(
    'Fetch the content from https://wwe.com and tell me what it says'
  )

  console.log('🤖 Response:', response.completion.content)
  console.log('\n📊 Metadata:')
  console.log(`   Model: ${response.metadata.model}`)
  console.log(`   Tokens: ${response.metadata.tokensUsed?.total_tokens}`)
  console.log(`   Latency: ${response.metadata.timing.latencyMs}ms`)

  await disconnectAllMCPClients() // Manual cleanup
}

main().catch(async (e) => {
  console.error(e)

  await disconnectAllMCPClients() // Manual cleanup
})
