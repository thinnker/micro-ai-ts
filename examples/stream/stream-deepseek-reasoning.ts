import { Micro } from '../../src/index'

async function main() {
  const micro = new Micro({
    model: 'deepseek:deepseek-reasoner',
    reasoning: true,
  })

  console.log('🧠 DeepSeek Reasoner Stream Example\n')
  console.log('Question: Solve this math puzzle...\n')

  const stream = await micro.stream(
    'If a train travels 120 miles in 2 hours, and then 180 miles in 3 hours, what is its average speed for the entire journey?'
  )

  for await (const chunk of stream) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
    } else {
      console.log('\n\n--- Analysis Complete ---')

      if (chunk.reasoning) {
        console.log('\n🤔 Reasoning Process:')
        console.log(chunk.reasoning.substring(0, 200) + '...')
      }

      console.log('\n✅ Final Answer:')
      console.log(chunk.fullContent)

      if (chunk.metadata) {
        console.log('\n📊 Metadata:')
        console.log('- Model:', chunk.metadata.model)
        console.log(
          '- Latency:',
          chunk.metadata.timing.latencySeconds,
          'seconds'
        )
        console.log('- Has Thoughts:', chunk.metadata.hasThoughts)
      }
    }
  }
}

main().catch(console.error)
