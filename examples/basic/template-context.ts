import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    systemPrompt:
      'You are a {{role}}. Your expertise is in {{domain}}. {{style}}',
    context: {
      role: 'senior software engineer',
      domain: 'TypeScript and Node',
      style: 'Explain concepts clearly and concisely.',
    },
  })

  const response = await client.chat(
    'What are the benefits of using TypeScript?'
  )

  console.log('Assistant:', response.completion.content)
}

main().catch(console.error)
