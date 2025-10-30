import { createTool } from '../../../src/index'
import { z } from 'zod'

export const calculatorTool = createTool(
  'calculator',
  'Performs basic arithmetic operations (add, subtract, multiply, divide)',
  z.object({
    operation: z
      .enum(['add', 'subtract', 'multiply', 'divide'])
      .describe('The arithmetic operation to perform'),
    a: z.number().describe('The first number'),
    b: z.number().describe('The second number'),
  }),
  async ({ operation, a, b }) => {
    let result = 0
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
    return {
      operation,
      a,
      b,
      result,
      message: `${a} ${operation} ${b} = ${result}`,
    }
  }
)
