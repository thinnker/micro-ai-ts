import { Micro } from '../../src/index'
import * as readline from 'readline'

async function main() {
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.7,
  })

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log("Interactive Chat (type 'exit' to quit)\n")

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      const userInput = input.trim()

      if (userInput.toLowerCase() === 'exit') {
        console.log('Goodbye!')
        rl.close()
        return
      }

      if (!userInput) {
        askQuestion()
        return
      }

      try {
        const response = await client.chat(userInput)
        console.log(`\nAssistant: ${response.completion.content}\n`)
      } catch (error: any) {
        console.error(`Error: ${error.message}\n`)
      }

      askQuestion()
    })
  }

  askQuestion()
}

main().catch(console.error)
