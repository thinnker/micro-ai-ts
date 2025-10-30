import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createProvider, Providers } from '../src/providers'

describe('Providers', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('createProvider', () => {
    it('should separate model from provider config', () => {
      const config = {
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
        model: 'test-model',
      }

      const result = createProvider(config)

      expect(result.model).toBe('test-model')
      expect(result.provider).toEqual({
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
      })
    })

    it('should handle provider with headers', () => {
      const config = {
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
        model: 'test-model',
        headers: {
          'X-Custom-Header': 'value',
        },
      }

      const result = createProvider(config)

      expect(result.provider.headers).toEqual({
        'X-Custom-Header': 'value',
      })
    })
  })

  describe('OpenAI Provider', () => {
    it('should create OpenAI provider with defaults', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'

      const provider = Providers.openai()

      expect(provider.apiKey).toBe('sk-test-key')
      expect(provider.baseURL).toBe('https://api.openai.com/v1')
      expect(provider.model).toBe('gpt-4.1-mini')
    })

    it('should accept custom model', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'

      const provider = Providers.openai('gpt-4o')

      expect(provider.model).toBe('gpt-4o')
    })

    it('should use custom base URL from env', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      process.env.OPENAI_BASE_URL = 'https://custom.openai.com/v1'

      const provider = Providers.openai()

      expect(provider.baseURL).toBe('https://custom.openai.com/v1')
    })
  })

  describe('Groq Provider', () => {
    it('should create Groq provider with defaults', () => {
      process.env.GROQ_API_KEY = 'gsk-test-key'

      const provider = Providers.groq()

      expect(provider.apiKey).toBe('gsk-test-key')
      expect(provider.baseURL).toBe('https://api.groq.com/openai/v1')
      expect(provider.model).toBe('llama-3.3-70b-versatile')
    })

    it('should accept custom model', () => {
      process.env.GROQ_API_KEY = 'gsk-test-key'

      const provider = Providers.groq('llama-3.3-70b-versatile')

      expect(provider.model).toBe('llama-3.3-70b-versatile')
    })
  })

  describe('Gemini Provider', () => {
    it('should create Gemini provider with defaults', () => {
      process.env.GEMINI_API_KEY = 'gemini-test-key'

      const provider = Providers.gemini()

      expect(provider.apiKey).toBe('gemini-test-key')
      expect(provider.baseURL).toBe(
        'https://generativelanguage.googleapis.com/v1beta/openai'
      )
      expect(provider.model).toBe('gemini-2.5-flash-lite')
    })

    it('should accept custom model', () => {
      process.env.GEMINI_API_KEY = 'gemini-test-key'

      const provider = Providers.gemini('gemini-2.5-pro')

      expect(provider.model).toBe('gemini-2.5-pro')
    })
  })

  describe('AI302 Provider', () => {
    it('should create AI302 provider with defaults', () => {
      process.env.AI_302_API_KEY = 'ai302-test-key'

      const provider = Providers.ai302()

      expect(provider.apiKey).toBe('ai302-test-key')
      expect(provider.baseURL).toBe('https://api.302.ai/v1')
      expect(provider.model).toBe('gpt-4o-mini')
    })

    it('should accept custom model', () => {
      process.env.AI_302_API_KEY = 'ai302-test-key'

      const provider = Providers.ai302('gpt-4o')

      expect(provider.model).toBe('gpt-4o')
    })
  })

  describe('OpenRouter Provider', () => {
    it('should create OpenRouter provider with defaults', () => {
      process.env.OPENROUTER_API_KEY = 'or-test-key'

      const provider = Providers.openrouter()

      expect(provider.apiKey).toBe('or-test-key')
      expect(provider.baseURL).toBe('https://openrouter.ai/api/v1')
      expect(provider.model).toBe('anthropic/claude-haiku-4.5')
    })

    it('should accept custom model', () => {
      process.env.OPENROUTER_API_KEY = 'or-test-key'

      const provider = Providers.openrouter('anthropic/claude-sonnet-4')

      expect(provider.model).toBe('anthropic/claude-sonnet-4')
    })
  })

  describe('DeepSeek Provider', () => {
    it('should create DeepSeek provider with defaults', () => {
      process.env.DEEPSEEK_API_KEY = 'ds-test-key'

      const provider = Providers.deepseek()

      expect(provider.apiKey).toBe('ds-test-key')
      expect(provider.baseURL).toBe('https://api.deepseek.com/v1')
      expect(provider.model).toBe('deepseek-chat')
    })

    it('should accept custom model', () => {
      process.env.DEEPSEEK_API_KEY = 'ds-test-key'

      const provider = Providers.deepseek('deepseek-reasoner')

      expect(provider.model).toBe('deepseek-reasoner')
    })
  })

  describe('Grok Provider', () => {
    it('should create Grok provider with defaults', () => {
      process.env.GROK_API_KEY = 'grok-test-key'

      const provider = Providers.grok()

      expect(provider.apiKey).toBe('grok-test-key')
      expect(provider.baseURL).toBe('https://api.x.ai/v1')
      expect(provider.model).toBe('grok-4-fast')
    })

    it('should accept custom model', () => {
      process.env.GROK_API_KEY = 'grok-test-key'

      const provider = Providers.grok('grok-4')

      expect(provider.model).toBe('grok-4')
    })
  })

  describe('Environment Variable Fallbacks', () => {
    it('should return empty string when API key not set', () => {
      delete process.env.OPENAI_API_KEY

      const provider = Providers.openai()

      expect(provider.apiKey).toBe('')
    })

    it('should use default base URL when env not set', () => {
      delete process.env.OPENAI_BASE_URL
      process.env.OPENAI_API_KEY = 'test-key'

      const provider = Providers.openai()

      expect(provider.baseURL).toBe('https://api.openai.com/v1')
    })
  })

  describe('Provider Consistency', () => {
    it('all providers should return consistent structure', () => {
      const providers = [
        Providers.openai('test-model'),
        Providers.groq('test-model'),
        Providers.gemini('test-model'),
        Providers.ai302('test-model'),
        Providers.openrouter('test-model'),
        Providers.deepseek('test-model'),
        Providers.grok('test-model'),
      ]

      providers.forEach((provider) => {
        expect(provider).toHaveProperty('apiKey')
        expect(provider).toHaveProperty('baseURL')
        expect(provider).toHaveProperty('model')
        expect(provider.model).toBe('test-model')
      })
    })
  })
})
