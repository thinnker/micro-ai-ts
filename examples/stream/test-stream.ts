import { Micro } from '../../src/index'

async function main() {
  console.log('Testing .stream() method...\n')

  const micro = new Micro({
    model: 'openai:gpt-4o-mini',
  })

  console.log('Question: Count from 1 to 5\n')
  console.log('Response: ')

  const stream = await micro.stream('Count from 1 to 5, one number per line')

  for await (const chunk of stream) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
    } else {
      console.log('\n\n✅ Stream completed successfully!')
      console.log('Full content length:', chunk.fullContent.length)
      if (chunk.metadata) {
        console.log('Latency:', chunk.metadata.timing.latencyMs, 'ms')
      }
    }
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
