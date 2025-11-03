import { Micro } from '../../src/client'

const MODEL = 'openrouter:openai/gpt-5-nano'

async function streamingExample() {
  // Initialize the Micro client
  const micro = new Micro({
    model: MODEL,
    systemPrompt:
      'You are a helpful assistant that provides detailed explanations.',
    temperature: 0.7,
    maxTokens: 500,
    debug: true,
  })

  console.log('🚀 Starting streaming example...\n')

  try {
    // Start streaming
    const stream = await micro.stream(
      'Explain how machine learning works in simple terms'
    )

    let totalTokens = 0
    let promptTokens = 0
    let completionTokens = 0

    // Process each chunk as it arrives
    for await (const chunk of stream) {
      if (!chunk.done) {
        // Stream in progress - show the delta content
        process.stdout.write(chunk.delta)
      } else {
        // Stream completed - show final metadata including token usage
        console.log('\n\n📊 Stream completed! Final metadata:')
        console.log('=====================================')

        if (chunk.metadata?.tokensUsed) {
          const tokens = chunk.metadata.tokensUsed
          totalTokens = tokens.total_tokens || 0
          promptTokens = tokens.prompt_tokens || 0
          completionTokens = tokens.completion_tokens || 0

          console.log(`📝 Prompt tokens: ${promptTokens}`)
          console.log(`💬 Completion tokens: ${completionTokens}`)
          console.log(`🔢 Total tokens: ${totalTokens}`)
        } else {
          console.log('⚠️  Token usage information not available')
        }

        console.log(`⏱️  Latency: ${chunk.metadata?.timing.latencyMs}ms`)
        console.log(`🤖 Model: ${chunk.metadata?.model}`)
        console.log(`🔗 Provider: ${chunk.metadata?.providerName}`)
        console.log(`📅 Timestamp: ${chunk.metadata?.timestamp}`)

        if (chunk.reasoning) {
          console.log(`🧠 Reasoning: ${chunk.reasoning}`)
        }

        console.log('=====================================')
      }
    }

    // Calculate cost estimation (example rates for GPT-4o-mini)
    if (totalTokens > 0) {
      const inputCostPer1K = 0.00015 // $0.00015 per 1K input tokens
      const outputCostPer1K = 0.0006 // $0.0006 per 1K output tokens

      const inputCost = (promptTokens / 1000) * inputCostPer1K
      const outputCost = (completionTokens / 1000) * outputCostPer1K
      const totalCost = inputCost + outputCost

      console.log('\n💰 Cost Estimation:')
      console.log(`Input cost: $${inputCost.toFixed(6)}`)
      console.log(`Output cost: $${outputCost.toFixed(6)}`)
      console.log(`Total cost: $${totalCost.toFixed(6)}`)
    }
  } catch (error) {
    console.error('❌ Error during streaming:', error)
  }
}

async function streamingWithCallbacksExample() {
  console.log('\n\n🔄 Starting streaming with callbacks example...\n')

  const micro = new Micro({
    model: MODEL,
    systemPrompt: 'You are a concise assistant.',
    onComplete: (response) => {
      console.log('\n✅ onComplete callback triggered')
      if (response.metadata.tokensUsed) {
        console.log(
          `Tokens used: ${JSON.stringify(response.metadata.tokensUsed, null, 2)}`
        )
      }
    },
    onMessage: (messages) => {
      console.log(
        `📨 Message history updated. Total messages: ${messages.length}`
      )
    },
  })

  try {
    const stream = await micro.stream('What are the benefits of TypeScript?')

    let chunkCount = 0
    for await (const chunk of stream) {
      chunkCount++

      if (!chunk.done) {
        // Show progress
        if (chunkCount % 5 === 0) {
          process.stdout.write('.')
        }
      } else {
        console.log(`\n\n🎯 Received ${chunkCount} chunks total`)

        // Access token usage from the final chunk
        if (chunk.metadata?.tokensUsed) {
          console.log('📊 Token Usage from Stream:')
          console.log(JSON.stringify(chunk.metadata.tokensUsed, null, 2))
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function compareStreamingVsNonStreaming() {
  console.log('\n\n⚖️  Comparing streaming vs non-streaming token usage...\n')

  const prompt = 'Explain the difference between async and sync programming'

  // Non-streaming request
  console.log('🔄 Non-streaming request...')
  const microNonStream = new Micro({
    model: MODEL,
    maxTokens: 200,
  })

  const nonStreamResponse = await microNonStream.chat(prompt)
  console.log('✅ Non-streaming completed')
  console.log('Tokens:', nonStreamResponse.metadata.tokensUsed)

  // Streaming request
  console.log('\n🌊 Streaming request...')
  const microStream = new Micro({
    model: MODEL,
    maxTokens: 200,
  })

  const stream = await microStream.stream(prompt)
  let streamTokens = null

  for await (const chunk of stream) {
    if (chunk.done && chunk.metadata?.tokensUsed) {
      streamTokens = chunk.metadata.tokensUsed
      break
    }
  }

  console.log('✅ Streaming completed')
  console.log('Tokens:', streamTokens)

  // Compare results
  console.log('\n📊 Comparison:')
  console.log('Non-streaming tokens:', nonStreamResponse.metadata.tokensUsed)
  console.log('Streaming tokens:', streamTokens)

  if (nonStreamResponse.metadata.tokensUsed && streamTokens) {
    const match =
      JSON.stringify(nonStreamResponse.metadata.tokensUsed) ===
      JSON.stringify(streamTokens)
    console.log(`Token usage matches: ${match ? '✅' : '❌'}`)
  }
}

// Run all examples
async function runAllExamples() {
  await streamingExample()
  await streamingWithCallbacksExample()
  await compareStreamingVsNonStreaming()
}

// Export for use in other files
export {
  streamingExample,
  streamingWithCallbacksExample,
  compareStreamingVsNonStreaming,
  runAllExamples,
}

runAllExamples().catch(console.error)
