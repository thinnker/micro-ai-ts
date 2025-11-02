import { Micro } from '../../src/index'

async function main() {
  const micro = new Micro({
    model: 'openai:gpt-4o-mini',
  })

  console.log('=== Turn 1 ===\n')
  const stream1 = await micro.stream('What is 2+2?')

  for await (const chunk of stream1) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
    }
  }

  console.log('\n\n=== Turn 2 ===\n')
  const stream2 = await micro.stream('Now multiply that by 3')

  for await (const chunk of stream2) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
    } else {
      console.log('\n\n--- Conversation Complete ---')
      console.log('Messages in history:', micro.getMessages().length)
    }
  }
}

main().catch(console.error)
