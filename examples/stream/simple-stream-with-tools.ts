import { createTool, Micro, z } from '../../src/index'

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
  const micro = new Micro({
    model: 'openrouter:openai/gpt-4.1-nano',
    tools: [addTool, multiplyTool],
  })

  console.log('Starting stream...\n')

  const stream = await micro.stream(
    'What is 150 + 300? Then multiply the result by 50. Then write a poem about it.'
  )

  let reasoningLabelShown = false
  let deltaLabelShown = false

  for await (const chunk of stream) {
    if (!chunk.done && chunk.reasoning) {
      if (!reasoningLabelShown) {
        console.log('\n--- Reasoning ---')
        reasoningLabelShown = true
      }
      process.stdout.write(chunk.reasoning)
    }

    if (!chunk.done && chunk.delta) {
      if (!deltaLabelShown) {
        console.log('\n--- Response ---')
        deltaLabelShown = true
      }
      process.stdout.write(chunk.delta)
    }

    if (chunk.done && chunk.metadata) {
      console.log('\n\nTime taken:', chunk.metadata?.timing.latencySeconds)
      console.log('Total tokens:', chunk.metadata?.tokensUsed?.total_tokens)
    }
  }
}

main().catch(console.error)
