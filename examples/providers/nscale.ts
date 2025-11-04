import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    model: 'nscale:meta-llama/Llama-3.1-8B-Instruct',
    temperature: 0.1,
  })

  const response = await client.chat(
    'Explain the concept of async/await in JavaScript.'
  )

  console.log('Provider: Nscale Serverless')
  console.log('Model:', response.metadata.model)
  console.log('\nResponse:', response.completion.content)
  console.log('\nTokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
}

main().catch(console.error)
