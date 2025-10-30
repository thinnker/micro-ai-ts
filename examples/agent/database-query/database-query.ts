import { Agent } from '../../../src/index'
import { databaseTool } from './tools'
import { microlog } from '../../../src/utils/utils'

async function main() {
  const agent = Agent.create({
    name: 'Data Assistant',
    background:
      'You are a data assistant that helps users query and understand database information. Use the query_database tool to fetch information.',
    model: 'openai:gpt-4.1-mini',
    tools: [databaseTool],
    temperature: 0,
  })

  microlog('User', 'How many users are in the database?')
  const response1 = await agent.chat('How many users are in the database?')
  microlog('Agent', response1.completion.content)

  microlog('User', 'Can you show me all of them?')
  const response2 = await agent.chat('Can you show me all of them?')
  microlog('Agent', response2.completion.content)

  microlog('User', 'Tell me more about user with ID 2')
  const response3 = await agent.chat('Tell me more about user with ID 2')
  microlog('Agent', response3.completion.content)

  const messages = agent.getMessages()
  microlog('Total messages', messages.length)
}

main().catch(console.error)
