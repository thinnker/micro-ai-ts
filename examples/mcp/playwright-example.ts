/**
 * Playwright MCP Example
 *
 * This example shows how to use the Playwright MCP server
 * to give AI browser automation capabilities.
 *
 * Prerequisites:
 * - Set OPENAI_API_KEY in .env
 * - Playwright MCP will auto-install on first run
 *
 * Run: pnpm check:example examples/mcp/playwright-example.ts
 */

import { Micro, createMCPTools } from '../../src/index'

async function main() {
  console.log('🚀 Loading Playwright MCP tools...\n')

  // Load Playwright browser automation tools
  const browserTools = await createMCPTools({
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  })

  console.log(`✅ Loaded ${browserTools.length} browser tool(s)`)
  console.log(
    `   Tools: ${browserTools.map((t) => t.schema.function.name).join(', ')}\n`
  )

  // Create AI with browser capabilities
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    tools: browserTools,
    onToolCall: (toolResponse) => {
      console.log(`🔧 Browser action: ${toolResponse.toolName}`)
    },
  })

  // Example 1: Web scraping
  console.log('📊 Example 1: Scraping GitHub trending\n')

  const trending = await client.chat(
    'Go to https://github.com/trending and tell me the top 3 trending repositories today'
  )

  console.log('🤖 Response:', trending.completion.content)

  // Example 2: Form interaction
  console.log('\n\n🔍 Example 2: Search interaction\n')

  const search = await client.chat(
    'Go to https://www.google.com, search for "TypeScript", and tell me the first result title. When you done close the session.'
  )

  console.log('🤖 Response:', search.completion.content)

  console.log('\n✨ Done!')
}

main().catch(console.error)
