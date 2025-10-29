import { Agent, createTool } from '../../src/index'
import { z } from 'zod'

async function main() {
  const calculatorTool = createTool(
    'calculator',
    'Performs basic arithmetic operations',
    z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number(),
      b: z.number(),
    }),
    async ({ operation, a, b }) => {
      let result = 0
      switch (operation) {
        case 'add':
          result = a + b
          break
        case 'subtract':
          result = a - b
          break
        case 'multiply':
          result = a * b
          break
        case 'divide':
          if (b === 0) throw new Error('Cannot divide by zero')
          result = a / b
          break
      }
      return { operation, a, b, result }
    }
  )

  const agent = Agent.create({
    name: 'Calculator Agent',
    instructions: 'You are a calculator agent. Use the calculator tool.',
    model: 'openai:gpt-4.1-mini',
    tools: [calculatorTool],
    temperature: 0,
    onToolCall: (toolResponse) => {
      if (toolResponse.error) {
        console.log(`Tool Error: ${toolResponse.error}`)
      }
    },
  })

  console.log('User: What is 10 divided by 0?')
  const response = await agent.chat('What is 10 divided by 0?')
  console.log('Agent:', response.completion.content)
}

main().catch(console.error)
