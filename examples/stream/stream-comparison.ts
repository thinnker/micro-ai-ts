import { Micro } from '../../src/index'

async function main() {
  const micro = new Micro({
    model: 'openai:gpt-4o-mini',
  })

  const question = 'Explain what TypeScript is in one sentence'

  console.log('=== Non-Streaming (chat) ===\n')
  const startChat = Date.now()
  const chatResponse = await micro.chat(question)
  const chatTime = Date.now() - startChat
  console.log(chatResponse.completion.content)
  console.log(`\nTime: ${chatTime}ms\n`)

  console.log('\n=== Streaming (stream) ===\n')
  const startStream = Date.now()
  const stream = await micro.stream(question)

  let firstChunkTime = 0
  for await (const chunk of stream) {
    if (!chunk.done) {
      if (firstChunkTime === 0) {
        firstChunkTime = Date.now() - startStream
      }
      process.stdout.write(chunk.delta)
    } else {
      const totalTime = Date.now() - startStream
      console.log(`\n\nTime to first chunk: ${firstChunkTime}ms`)
      console.log(`Total time: ${totalTime}ms`)
    }
  }
}

main().catch(console.error)
