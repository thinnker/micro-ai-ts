import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    model: 'openai:gpt-4.1-nano',
    // model: "ai302:grok-4-fast-non-reasoning",
    systemPrompt: 'You are a friendly tutor teaching programming concepts.',
    maxTokens: 200,
  })

  const response1 = await client.chat('What is a variable in programming?')
  console.log('User: What is a variable in programming?')
  console.log('Assistant:', response1.completion.content)

  const messages = client.getMessages()
  console.log(`\nMessages: ${JSON.stringify(messages, null, 3)}`)
  console.log(`\nMessages count: ${messages.length}`)

  const response2 = await client.chat(
    'Can you give me an example in TypeScript?'
  )
  console.log('\nUser: Can you give me an example in TypeScript?')
  console.log('Assistant:', response2.completion.content)

  const messages2 = client.getMessages()
  console.log(`\nMessages 2: ${JSON.stringify(messages2, null, 3)}`)
  console.log(`\nMessages 2 count: ${messages2.length}`)

  console.log(`\n1. Metadata: ${JSON.stringify(response1, null, 2)}`)
  console.log(`\n2. Metadata: ${JSON.stringify(response2, null, 2)}`)
}

main().catch(console.error)
