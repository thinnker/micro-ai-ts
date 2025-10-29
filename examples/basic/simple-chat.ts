import { Micro } from '../../src/index'

async function main() {
  const client = new Micro() // will always default to "openai:gpt-4.1-mini" as in Providers

  const response = await client.chat(
    'Explain what a TypeScript library is in one sentence.'
  )

  console.log('Assistant:', response.completion.content)
  console.log('\nModel:', response.metadata.model)
  console.log('Tokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
  console.log('\nResponse:', response)
}

main().catch(console.error)
