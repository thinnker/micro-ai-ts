import { createTool } from '../../../src/index'
import { z } from 'zod'

export const databaseTool = createTool(
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
        if (!user_id) throw new Error('user_id is required for get_user query')
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
