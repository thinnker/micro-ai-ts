import { Agent } from '../../../src/index'
import { calculatorTool } from './tools'
import { microlog } from '../../../src/utils/utils'

async function main() {
  const agent = Agent.create({
    name: 'Calculator Agent',
    background: 'You are a calculator agent. Use the calculator tool.',
    model: 'openai:gpt-4.1-mini',
    tools: [calculatorTool],
    temperature: 0,
    onToolCall: (toolResponse) => {
      if (toolResponse.error) {
        microlog('Tool Error', toolResponse.error)
      }
    },
  })

  microlog('User', 'What is 10 divided by 0?')
  const response = await agent.chat('What is 10 divided by 0?')
  microlog('Agent', response.completion.content)
}

main().catch(console.error)
