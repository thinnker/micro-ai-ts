import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    model: 'deepseek:deepseek-chat',
    temperature: 0.7,
  })

  const response = await client.chat(
    'Explain the concept of async/await in JavaScript.'
  )

  console.log('Provider: DeepSeek')
  console.log('Model:', response.metadata.model)
  console.log('\nResponse:', response.completion.content)
  console.log('\nTokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
}

main().catch(console.error)
