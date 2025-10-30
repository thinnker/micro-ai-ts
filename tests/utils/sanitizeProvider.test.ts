import { describe, it, expect } from 'vitest'
import { sanitizeProvider } from '../../src/utils/utils'

describe('sanitizeProvider', () => {
  it('should mask API key with proper format', () => {
    const provider = {
      apiKey: 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz',
      baseURL: 'https://api.openai.com/v1',
    }
    const result = sanitizeProvider(provider)
    expect(result.baseURL).toBe('https://api.openai.com/v1')
    expect(result.apiKey).toContain('sk-proj-12')
    expect(result.apiKey).toContain('•')
    expect(result.apiKey).toContain('vwxyz')
  })

  it('should handle short API keys', () => {
    const provider = {
      apiKey: 'short',
      baseURL: 'https://api.test.com',
    }
    const result = sanitizeProvider(provider)
    expect(result.apiKey).toBe('•••••')
  })

  it('should handle medium length keys', () => {
    const provider = {
      apiKey: '12345678901234',
      baseURL: 'https://api.test.com',
    }
    const result = sanitizeProvider(provider)
    expect(result.apiKey).toContain('1234567890')
    expect(result.apiKey).toContain('•')
  })

  it('should not modify provider without apiKey', () => {
    const provider = {
      apiKey: '',
      baseURL: 'https://api.test.com',
    }
    const result = sanitizeProvider(provider)
    expect(result.baseURL).toBe('https://api.test.com')
  })

  it('should handle null/undefined provider', () => {
    expect(sanitizeProvider(null as any)).toBe(null)
    expect(sanitizeProvider(undefined as any)).toBe(undefined)
  })
})
