import { describe, it, expect } from 'vitest'
import { parseTemplate } from '../../src/utils/utils'

describe('parseTemplate', () => {
  it('should replace single variable', () => {
    const result = parseTemplate('Hello {{name}}', { name: 'World' })
    expect(result).toBe('Hello World')
  })

  it('should replace multiple variables', () => {
    const result = parseTemplate('{{greeting}} {{name}}!', {
      greeting: 'Hello',
      name: 'Alice',
    })
    expect(result).toBe('Hello Alice!')
  })

  it('should leave unmatched placeholders unchanged', () => {
    const result = parseTemplate('Hello {{name}}', {})
    expect(result).toBe('Hello {{name}}')
  })

  it('should handle empty context', () => {
    const result = parseTemplate('No variables here', {})
    expect(result).toBe('No variables here')
  })

  it('should convert non-string values to strings', () => {
    const result = parseTemplate('Count: {{count}}', { count: 42 })
    expect(result).toBe('Count: 42')
  })
})
