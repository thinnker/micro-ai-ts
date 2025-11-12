/**
 * Playwright Agent Example
 *
 * An autonomous agent that can browse the web and gather information.
 *
 * Prerequisites:
 * - Set OPENAI_API_KEY in .env
 *
 * Run: pnpm check:example examples/mcp/playwright-agent.ts
 */

import { Agent, createMCPTools } from '../../src/index'

async function main() {
  console.log('🤖 Creating web research agent...\n')

  // Load browser tools
  const browserTools = await createMCPTools({
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  })

  // Create an autonomous web research agent
  const agent = Agent.create({
    name: 'Web Research Agent',
    background: `You are a web research assistant with browser automation capabilities.
    You can navigate websites, click elements, fill forms, and extract information.
    Always be thorough and verify information from multiple sources when possible.`,
    model: 'openai:gpt-4.1-mini',
    tools: browserTools,
    onToolCall: (response) => {
      console.log(`\n🌐 ${response.toolName}`)
      if (response.error) {
        console.log(`   ❌ Error: ${response.error}`)
      }
    },
  })

  // Task 1: Research and compare
  console.log('📋 Task: Research TypeScript vs JavaScript\n')

  const research = await agent.chat(`
    Research the differences between TypeScript and JavaScript.
    Visit relevant documentation sites and summarize the key differences.
  `)

  console.log('\n🤖 Agent Report:\n')
  console.log(research.completion.content)

  // Task 2: Check status
  console.log('\n\n📋 Task: Check GitHub status\n')

  const status = await agent.chat(
    'Go to https://www.githubstatus.com and tell me if all systems are operational'
  )

  console.log('\n🤖 Agent Report:\n')
  console.log(status.completion.content)

  console.log('\n✅ Research complete!')
}

main().catch(console.error)
