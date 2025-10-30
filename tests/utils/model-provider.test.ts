import { describe, it, expect } from 'vitest'
import { stripModelName, stripProviderName } from '../../src/utils/utils'

describe('stripModelName', () => {
  it('should extract model name from provider:model format', () => {
    expect(stripModelName('openai:gpt-4o-mini')).toBe('gpt-4o-mini')
  })

  it('should return original string if no colon', () => {
    expect(stripModelName('gpt-4o-mini')).toBe('gpt-4o-mini')
  })

  it('should handle multiple colons', () => {
    expect(stripModelName('provider:model')).toBe('model')
  })
})

describe('stripProviderName', () => {
  it('should extract provider name from provider:model format', () => {
    expect(stripProviderName('openai:gpt-4o-mini')).toBe('openai')
  })

  it('should return empty string if no colon', () => {
    expect(stripProviderName('gpt-4o-mini')).toBe('')
  })

  it('should handle multiple colons', () => {
    expect(stripProviderName('provider:model:version')).toBe('provider')
  })
})
