import { Micro } from '../../src/index'

async function main() {
  const micro = new Micro({
    model: 'openai:gpt-4o-mini',
    systemPrompt: 'You are a helpful assistant that speaks like a pirate.',
  })

  console.log('🏴‍☠️ Pirate Assistant Stream\n')

  const stream = await micro.stream('Tell me about the weather today')

  let fullText = ''
  for await (const chunk of stream) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
      fullText += chunk.delta
    } else {
      console.log('\n\n--- Final Response ---')
      console.log('Total characters:', fullText.length)
      if (chunk.metadata) {
        console.log('Latency:', chunk.metadata.timing.latencySeconds, 'seconds')
      }
    }
  }
}

main().catch(console.error)
