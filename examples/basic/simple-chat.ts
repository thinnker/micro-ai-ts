import { Micro } from '../../src/index'
import { microlog } from '../../src/utils'

async function main() {
  const client = new Micro() // will always default to "openai:gpt-4.1-mini" as in Providers

  const response = await client.chat(
    'Explain what a TypeScript library is in one sentence. Keep it simple.'
  )

  microlog('Assistant:', response.completion.content)
  microlog('Model:', response.metadata.model)
  microlog('Tokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
  microlog('Metadata:', response.metadata || 'N/A')
}

main().catch(console.error)
