/**
 * Advanced Playwright Example
 *
 * Combines Playwright browser automation with other MCP tools
 * for powerful web automation workflows.
 *
 * Prerequisites:
 * - Set OPENAI_API_KEY in .env
 * - Install uv/uvx for filesystem tools
 *
 * Run: pnpm check:example examples/mcp/playwright-advanced.ts
 */

import { Micro, createMCPTools } from '../../src/index'
import path from 'path'

async function main() {
  console.log('🚀 Setting up advanced web automation...\n')

  // Load multiple MCP servers
  const browserTools = await createMCPTools({
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  })

  const fileTools = await createMCPTools({
    command: 'uvx',
    args: ['mcp-server-filesystem', path.resolve(process.cwd())],
  })

  console.log('✅ Tools loaded:')
  console.log(`   - Browser tools: ${browserTools.length}`)
  console.log(`   - File tools: ${fileTools.length}\n`)

  // Combine browser and file system tools
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    tools: [...browserTools, ...fileTools],
    onToolCall: (response) => {
      const type = response.toolName.startsWith('browser_') ? '🌐' : '📁'
      console.log(`${type} ${response.toolName}`)
    },
  })

  // Complex workflow: Scrape and save
  console.log('📋 Task: Scrape GitHub trending and save to file\n')

  const result = await client.chat(`
    1. Go to https://github.com/trending
    2. Extract the top 5 trending repositories (name, description, stars)
    3. Format the data nicely
    4. Save it to a file called "trending-repos.txt"
  `)

  console.log('\n🤖 Result:\n')
  console.log(result.completion.content)

  console.log('\n✨ Workflow complete!')
  console.log('Check trending-repos.txt for the results')
}

main().catch(console.error)
