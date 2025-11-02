import { Micro } from '../../src/index'

async function main() {
  const micro = new Micro({
    model: 'openai:gpt-4o-mini',
  })

  console.log('Starting stream...\n')

  const stream = await micro.stream('Write a short poem about TypeScript')

  for await (const chunk of stream) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
    } else {
      console.log('\n\n--- Stream Complete ---')
      console.log('Full content:', chunk.fullContent)
      if (chunk.metadata) {
        console.log('Metadata:', chunk.metadata)
      }
    }
  }
}

main().catch(console.error)
