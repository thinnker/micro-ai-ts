import { Micro } from '../../src/client'

async function simpleStreamingExample() {
  const micro = new Micro({
    model: 'deepseek:deepseek-chat',
    systemPrompt: 'You are a helpful assistant.',
  })

  console.log('Starting stream...\n')

  const stream = await micro.stream('Write a short poem about coding')

  for await (const chunk of stream) {
    if (!chunk.done) {
      // Print each piece of content as it arrives
      process.stdout.write(chunk.delta)
    } else {
      // Stream is complete - now we have token usage info
      console.log('\n\n--- Stream Complete ---')

      if (chunk.metadata?.tokensUsed) {
        const { prompt_tokens, completion_tokens, total_tokens } =
          chunk.metadata.tokensUsed
        console.log(`Prompt tokens: ${prompt_tokens}`)
        console.log(`Completion tokens: ${completion_tokens}`)
        console.log(`Total tokens: ${total_tokens}`)
      }

      console.log(`Latency: ${chunk.metadata?.timing.latencyMs}ms`)
    }
  }
}

// Run the example
simpleStreamingExample().catch(console.error)
