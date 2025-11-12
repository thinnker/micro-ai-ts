import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    model: 'minimax:MiniMax-M2',
    temperature: 0.7,
  })

  const response = await client.chat(
    'Explain the concept of async/await in JavaScript in 50 words.'
  )

  console.log('Provider: Minimax')
  console.log('Model:', response.metadata.model)
  console.log('\nResponse:', response.completion.content)
  console.log('\nTokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
}

main().catch(console.error)
