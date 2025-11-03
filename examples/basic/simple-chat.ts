import { Micro } from '../../src/index'

async function main() {
  const client = new Micro({
    // model: 'openai:gpt-4o-mini',
    // model: 'openai:gpt-5-nano',
    // model: 'openai:gpt-5-mini',
    // model: 'openrouter:openai/gpt-oss-safeguard-20b', // reasoning .reasoning
    model: 'openrouter:nvidia/nemotron-nano-12b-v2-vl:free', // reasoning .reasoning
    // model: 'openrouter:minimax/minimax-m2:free', // reasoning .reasoning
    // model: 'ai302:grok-4-fast-reasoning',
    // model: 'ai302:sophnet/GLM-4.6', reasoning_content
    // model: 'ai302:glm-4.5-air', // reasoning

    // model: 'gemini:gemini-2.5-flash-lite', // reasoning <thought> tag
    // model: 'deepseek:deepseek-reasoner',
    debug: true,
  }) // will always default to "openai:gpt-4.1-mini" as in Providers

  const response = await client.chat(
    'Explain what a TypeScript library is in one sentence. Think hard.'
  )

  // console.log('Assistant:', response.completion.content)
  // console.log('\nModel:', response.metadata.model)
  // console.log('Tokens:', response.metadata.tokensUsed?.total_tokens || 'N/A')
  console.log('\nResponse:', JSON.stringify(response, null, 3))
}

main().catch(console.error)
