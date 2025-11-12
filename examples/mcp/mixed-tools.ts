/**
 * Mixed Tools Example
 *
 * This example shows how to combine regular Micro AI tools
 * with MCP tools in the same client.
 *
 * Prerequisites:
 * - Install uv/uvx: https://docs.astral.sh/uv/getting-started/installation/
 * - Set OPENAI_API_KEY in .env
 *
 * Run: pnpm check:example examples/mcp/mixed-tools.ts
 */

import { Micro, createTool, createMCPTools, z } from '../../src/index'

async function main() {
  console.log('🚀 Setting up mixed tools (regular + MCP)...\n')

  // Create a regular Micro AI tool
  const calculatorTool = createTool(
    'calculator',
    'Performs arithmetic operations',
    z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number(),
      b: z.number(),
    }),
    async ({ operation, a, b }) => {
      const ops = {
        add: a + b,
        subtract: a - b,
        multiply: a * b,
        divide: a / b,
      }
      return ops[operation]
    }
  )

  // Load MCP tools
  const mcpTools = await createMCPTools({
    command: 'uvx',
    args: ['mcp-server-fetch'],
  })

  console.log('✅ Tools loaded:')
  console.log(`   - Regular tools: calculator`)
  console.log(
    `   - MCP tools: ${mcpTools.map((t) => t.schema.function.name).join(', ')}\n`
  )

  // Combine both types of tools
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    tools: [calculatorTool, ...mcpTools],
    onToolCall: (toolResponse) => {
      console.log(`🔧 Tool: ${toolResponse.toolName}`)
      console.log(
        `   Type: ${toolResponse.toolName === 'calculator' ? 'Regular' : 'MCP'}`
      )
    },
  })

  // Test using both types of tools
  console.log('💬 Task: Fetch a webpage and do some math\n')

  const response = await client.chat(
    'First, calculate 150 + 300. Then fetch https://example.com and tell me if the sum appears in the content.'
  )

  console.log('\n🤖 Response:\n')
  console.log(response.completion.content)

  console.log('\n📊 Metadata:')
  console.log(`   Model: ${response.metadata.model}`)
  console.log(`   Tokens: ${response.metadata.tokensUsed?.total_tokens}`)
  console.log(`   Latency: ${response.metadata.timing.latencyMs}ms`)
}

main().catch(console.error)
