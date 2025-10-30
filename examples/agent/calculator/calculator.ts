import { Agent } from '../../../src/index'
import { calculatorTool } from './tools'
import { microlog } from '../../../src/utils/utils'

async function main() {
  const agent = Agent.create({
    name: 'Math Assistant',
    background:
      'You are a helpful math assistant. Use the calculator tool to perform calculations and explain the results clearly.',
    model: 'openai:gpt-4.1-nano',
    tools: [calculatorTool],
  })

  const response = await agent.chat(
    'What is 156 multiplied by 23? Please calculate it and explain the result.'
  )

  microlog('Response', response.completion.content)
  microlog('Tokens', response.metadata.tokensUsed?.total_tokens || 'N/A')
}

main().catch(console.error)
