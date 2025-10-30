import { Agent } from '../../../src/index'
import { weatherTool, timeTool } from './tools'
import { microlog } from '../../../src/utils/utils'

async function main() {
  const agent = Agent.create({
    name: 'Personal Assistant',
    background:
      'You are a helpful personal assistant. Use the available tools to provide accurate information about weather and time. Always be friendly and concise.',
    goal: 'Answer the user queries and provide accurate information.',
    debug: true,
    tools: [weatherTool, timeTool],
  })

  const response = await agent.chat(
    "What's the weather like in Tokyo and what time is it there?"
  )

  microlog('Response', response.completion.content)
}

main().catch(console.error)
