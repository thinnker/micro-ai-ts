import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    model: 'openai:gpt-5-nano',
    systemPrompt: 'You are a helpful assistant that provides concise answers.',
    temperature: 0.7, // <--- causes ERROR as GPT 5 series only respects temperature:1. Code out for success
    maxTokens: 500,
  })

  const response = await client.chat(
    'Explain what a TypeScript library is in one sentence.'
  )

  const { completion, metadata, error } = response // Example of deconstruction in case of error

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Assistant:', completion.content)
  console.log('\nModel:', metadata.model)
  console.log('Tokens:', metadata.tokensUsed?.total_tokens || 'N/A')
}

main().catch(console.error)
