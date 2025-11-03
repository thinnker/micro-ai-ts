import { Micro } from '../../src/index'

async function main() {
  const micro = new Micro({
    model: 'openrouter:minimax/minimax-m2:free',
  })

  console.log('Starting stream...\n')

  const stream = await micro.stream(
    'Explain what a TypeScript library is in one sentence. Think hard.'
  )

  let reasoningLabelShown = false
  let deltaLabelShown = false

  for await (const chunk of stream) {
    if (!chunk.done && chunk.reasoning) {
      if (!reasoningLabelShown) {
        console.log('--- Reasoning ---')
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
      console.log('\n-> Metadata:', chunk.metadata)
    }
  }
}

main().catch(console.error)
