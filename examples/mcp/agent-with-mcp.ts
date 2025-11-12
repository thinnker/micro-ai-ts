/**
 * Agent with MCP Tools Example
 *
 * This example demonstrates using MCP tools with an Agent.
 * The agent can autonomously use multiple MCP servers.
 *
 * Prerequisites:
 * - Install uv/uvx: https://docs.astral.sh/uv/getting-started/installation/
 * - Set OPENAI_API_KEY in .env
 *
 * Run: pnpm check:example examples/mcp/agent-with-mcp.ts
 */

import { Agent, createMCPTools } from '../../src/index'

async function main() {
  console.log('🚀 Loading MCP tools for agent...\n')

  // Load multiple MCP servers
  const fetchTools = await createMCPTools({
    command: 'uvx',
    args: ['mcp-server-fetch'],
  })

  console.log(`✅ Loaded ${fetchTools.length} tool(s) from mcp-server-fetch`)

  // Create an agent with MCP tools
  const agent = Agent.create({
    name: 'Research Assistant',
    background: `You are a helpful research assistant that can fetch web content.
    Use the available tools to gather information and provide comprehensive answers.`,
    model: 'openai:gpt-4.1-mini',
    tools: [...fetchTools],
    onToolCall: (toolResponse) => {
      console.log(`\n🔧 Agent used tool: ${toolResponse.toolName}`)
      if (toolResponse.error) {
        console.log(`   ❌ Error: ${toolResponse.error}`)
      } else {
        console.log(`   ✅ Success`)
      }
    },
  })

  // Test the agent
  console.log('\n💬 Task: Research TypeScript latest features\n')

  const response = await agent.chat(
    'Fetch https://www.typescriptlang.org/ and summarize the latest TypeScript features mentioned on the homepage'
  )

  console.log('🤖 Agent Response:\n')
  console.log(response.completion.content)

  console.log('\n📊 Metadata:')
  console.log(`   Model: ${response.metadata.model}`)
  console.log(`   Tokens: ${response.metadata.tokensUsed?.total_tokens}`)
  console.log(`   Latency: ${response.metadata.timing.latencyMs}ms`)
}

main().catch(console.error)
