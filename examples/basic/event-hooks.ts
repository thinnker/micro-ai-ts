import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    onComplete: (result) => {
      console.log(
        `[Complete] Tokens: ${
          result.metadata.tokensUsed?.total_tokens || 'N/A'
        }, Time: ${result.metadata.timing.latencySeconds.toFixed(2)}s`
      )
    },
    onMessage: (messages) => {
      console.log(`[Message] Conversation has ${messages.length} messages`)
    },
    onError: (error) => {
      console.error('[Error]', error)
    },
  })

  const response = await client.chat('Tell me a fun fact about TypeScript.')
  console.log('\nAssistant:', response.completion.content)
}

main().catch(console.error)
