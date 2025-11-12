/**
 * Streaming with MCP Tools Example
 *
 * This example shows streaming responses while using MCP tools.
 * Tool calls are handled automatically during streaming.
 *
 * Prerequisites:
 * - Install uv/uvx: https://docs.astral.sh/uv/getting-started/installation/
 * - Set OPENAI_API_KEY in .env
 *
 * Run: pnpm check:example examples/mcp/streaming-with-mcp.ts
 */

import { Micro, createMCPTools } from '../../src/index'

async function main() {
  console.log('🚀 Loading MCP tools...\n')

  // Create tools from MCP server
  const mcpTools = await createMCPTools({
    command: 'uvx',
    args: ['mcp-server-fetch'],
  })

  console.log(`✅ Loaded ${mcpTools.length} MCP tool(s)\n`)

  // Create Micro client with MCP tools
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    tools: mcpTools,
    onToolCall: (toolResponse) => {
      console.log(`\n🔧 Tool: ${toolResponse.toolName}`)
      console.log(`   Args: ${JSON.stringify(toolResponse.arguments)}`)
      console.log(
        `   Status: ${toolResponse.error ? '❌ Error' : '✅ Success'}\n`
      )
    },
  })

  // Stream response with automatic tool handling
  console.log('💬 Streaming response with MCP tools...\n')
  console.log('🤖 AI: ')

  const stream = await client.stream(
    'Fetch https://example.com and describe what you find in a poetic way'
  )

  for await (const chunk of stream) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
    } else {
      console.log('\n\n📊 Stream Complete:')
      console.log(`   Model: ${chunk.metadata?.model}`)
      console.log(
        `   Tokens: ${chunk.metadata?.tokensUsed?.total_tokens || 'N/A'}`
      )
      console.log(`   Latency: ${chunk.metadata?.timing.latencyMs}ms`)
    }
  }
}

main().catch(console.error)
