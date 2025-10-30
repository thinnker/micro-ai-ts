import { createTool } from '../../../src/index'
import { z } from 'zod'

export const calculatorTool = createTool(
  'calculator',
  'Performs basic arithmetic operations',
  z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  async ({ operation, a, b }) => {
    let result: number
    switch (operation) {
      case 'add':
        result = a + b
        break
      case 'subtract':
        result = a - b
        break
      case 'multiply':
        result = a * b
        break
      case 'divide':
        if (b === 0) throw new Error('Cannot divide by zero')
        result = a / b
        break
    }
    return { operation, a, b, result }
  }
)
