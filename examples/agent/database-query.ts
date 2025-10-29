import { Agent, createTool } from '../../src/index'
import { z } from 'zod'

async function main() {
  const databaseTool = createTool(
    'query_database',
    'Query a database for user information',
    z.object({
      query_type: z
        .enum(['get_user', 'list_users', 'count_users'])
        .describe('The type of query to perform'),
      user_id: z
        .string()
        .optional()
        .describe('User ID (required for get_user query)'),
    }),
    async ({ query_type, user_id }) => {
      const users = [
        { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
        { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
        { id: '3', name: 'Carol White', email: 'carol@example.com' },
      ]

      switch (query_type) {
        case 'get_user': {
          if (!user_id)
            throw new Error('user_id is required for get_user query')
          const user = users.find((u) => u.id === user_id)
          if (!user) return { error: `User with ID ${user_id} not found` }
          return { user }
        }
        case 'list_users':
          return { users }
        case 'count_users':
          return { count: users.length }
        default:
          throw new Error(`Unknown query type: ${query_type}`)
      }
    }
  )

  const agent = Agent.create({
    name: 'Data Assistant',
    instructions:
      'You are a data assistant that helps users query and understand database information. Use the query_database tool to fetch information.',
    model: 'openai:gpt-4.1-mini',
    tools: [databaseTool],
    temperature: 0,
  })

  console.log('User: How many users are in the database?')
  const response1 = await agent.chat('How many users are in the database?')
  console.log('Agent:', response1.completion.content)

  console.log('\nUser: Can you show me all of them?')
  const response2 = await agent.chat('Can you show me all of them?')
  console.log('Agent:', response2.completion.content)

  console.log('\nUser: Tell me more about user with ID 2')
  const response3 = await agent.chat('Tell me more about user with ID 2')
  console.log('Agent:', response3.completion.content)

  const messages = agent.getMessages()
  console.log(`\nTotal messages: ${messages.length}`)
}

main().catch(console.error)
