import { createTool, Micro, z } from '../../src/index'
import { microlog } from '../../src/utils'

const addTool = createTool(
  'add',
  'Adds two numbers together',
  z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  async ({ a, b }) => {
    console.log('\n[TOOLS] addTool', { a, b })
    const result = a + b
    return `The sum of ${a} and ${b} is ${result}`
  }
)

const multiplyTool = createTool(
  'multiply',
  'Multiplies two numbers',
  z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  async ({ a, b }) => {
    console.log('\n[TOOLS] multiplyTool', { a, b })
    const result = a * b
    return `The product of ${a} and ${b} is ${result}`
  }
)

async function main() {
  const client = new Micro({
    model: 'openrouter:openai/gpt-4o-mini',
    tools: [addTool, multiplyTool],
  })

  const response = await client.chat(
    'What is 150 + 300? Then multiply the result by 50. Also write a lovely haiku.'
  )

  microlog('Assistant:', response.completion.content)
  microlog('Model:', response.metadata.model)
  microlog('Tokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
  microlog('Metadata:', response.metadata || 'N/A')
}

main().catch(console.error)
