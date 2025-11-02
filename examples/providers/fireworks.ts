import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    model: 'fireworks:accounts/fireworks/models/llama4-maverick-instruct-basic',
    temperature: 0.7,
  })

  const response = await client.chat(
    'Explain the concept of async/await in JavaScript.'
  )

  console.log('Provider: Fireworks')
  console.log('Model:', response.metadata.model)
  console.log('\nResponse:', response.completion.content)
  console.log('\nTokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
}

main().catch(console.error)
