import { Micro } from '../../src/index'

async function main() {
  const micro = new Micro({
    model: 'openai:gpt-5-nano',
    reasoning: true,
    reasoning_effort: 'medium',
  })

  console.log('🧠 Reasoning Model Stream\n')
  console.log('Question: Solve this logic puzzle...\n')

  const stream = await micro.stream(
    'If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?'
  )

  for await (const chunk of stream) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
    } else {
      console.log('\n\n--- Analysis Complete ---')
      if (chunk.reasoning) {
        console.log('\n🤔 Reasoning Process:')
        console.log(chunk.reasoning)
      }
      console.log('\n✅ Final Answer:')
      console.log(chunk.fullContent)
    }
  }
}

main().catch(console.error)
