import { Agent } from '../../../src/index'
import { weatherTool, timeTool } from './tools'
import { microlog } from '../../../src/utils/utils'

async function main() {
  const agent = Agent.create({
    name: 'Personal Assistant',
    background:
      'You are a helpful personal assistant. Use the available tools to provide accurate information about weather and time. Always be friendly and concise.',
    goal: 'Answer the user queries and provide accurate information.',
    tools: [weatherTool, timeTool],
    debug: true,
    model: 'openai:gpt-4.1-nano',
    onComplete: (response) => microlog('COMPLETE', response.metadata),
    onMessage: (messages) =>
      microlog(
        `LAST MESSAGE [${messages?.[messages.length - 1]?.role}]`,
        JSON.stringify(messages?.[messages.length - 1], null, 2)
      ),
  })

  const response = await agent.chat(
    "What's the weather like in Tokyo and what time is it there?"
  )

  microlog('Response', JSON.stringify(response, null, 2))
}

main().catch(console.error)
