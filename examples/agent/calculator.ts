import { Agent, createTool } from '../../src/index'
import { z } from 'zod'

async function main() {
  const calculatorTool = createTool(
    'calculator',
    'Performs basic arithmetic operations (add, subtract, multiply, divide)',
    z.object({
      operation: z
        .enum(['add', 'subtract', 'multiply', 'divide'])
        .describe('The arithmetic operation to perform'),
      a: z.number().describe('The first number'),
      b: z.number().describe('The second number'),
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
      return {
        operation,
        a,
        b,
        result,
        message: `${a} ${operation} ${b} = ${result}`,
      }
    }
  )

  const agent = Agent.create({
    name: 'Math Assistant',
    instructions:
      'You are a helpful math assistant. Use the calculator tool to perform calculations and explain the results clearly.',
    model: 'openai:gpt-4.1-nano',
    tools: [calculatorTool],
  })

  const response = await agent.chat(
    'What is 156 multiplied by 23? Please calculate it and explain the result.'
  )

  console.log('Response:', response.completion.content)
  console.log('\nTokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
}

main().catch(console.error)
