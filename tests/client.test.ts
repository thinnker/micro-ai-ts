import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Micro } from '../src/client'
import type { Message } from '../src/types'

describe('Micro', () => {
  describe('Constructor', () => {
    it('should throw error when API key is missing', () => {
      // Save and clear env variable to ensure test isolation
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY

      try {
        expect(() => {
          new Micro({
            model: 'custom:test-model',
            provider: {
              apiKey: '',
              baseURL: 'https://api.example.com',
              model: 'test-model',
            },
          })
        }).toThrow('API Key is required')
      } finally {
        // Restore env variable
        if (originalKey) process.env.OPENAI_API_KEY = originalKey
      }
    })

    it('should initialize with default values', () => {
      const client = new Micro({
        model: 'test-model',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      const metadata = client.getMetadata()
      expect(metadata.id).toBeTruthy()
      expect(metadata.model).toBe('test-model')
    })

    it('should parse provider:model format', () => {
      const client = new Micro({
        model: 'openai:gpt-4o-mini',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      const metadata = client.getMetadata()
      expect(metadata.model).toBe('gpt-4o-mini')
      expect(metadata.providerName).toBe('openai')
    })

    it('should set system prompt from options', () => {
      const systemPrompt = 'You are a helpful assistant'
      const client = new Micro({
        systemPrompt,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(client.getSystemPrompt()).toBe(systemPrompt)
    })

    it('should parse template variables in system prompt', () => {
      const client = new Micro({
        systemPrompt: 'You are a {{role}}',
        context: { role: 'developer assistant' },
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(client.getSystemPrompt()).toBe('You are a developer assistant')
    })
  })

  describe('Message Management', () => {
    let client: Micro

    beforeEach(() => {
      client = new Micro({
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })
    })

    it('should add user message', () => {
      client.setUserMessage('Hello')
      const messages = client.getMessages()

      expect(messages).toHaveLength(1)
      expect(messages[0]?.role).toBe('user')
      expect(messages[0]?.content).toBe('Hello')
    })

    it('should add assistant message', () => {
      client.setAssistantMessage('Hi there')
      const messages = client.getMessages()

      const assistantMsg = messages.find((m) => m.role === 'assistant')
      expect(assistantMsg).toBeDefined()
      if (assistantMsg) {
        expect(assistantMsg.content).toBe('Hi there')
      }
    })

    it('should parse template in user message', () => {
      const client = new Micro({
        context: { name: 'Alice' },
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      client.setUserMessage('Hello {{name}}')
      const messages = client.getMessages()

      expect(messages[0]?.content).toBe('Hello Alice')
    })

    it('should flush all messages', () => {
      client.setUserMessage('Message 1')
      client.setUserMessage('Message 2')
      expect(client.getMessages().length).toBeGreaterThan(0)

      client.flushAllMessages()
      expect(client.getMessages()).toHaveLength(0)
    })

    it('should limit messages correctly', () => {
      const client = new Micro({
        systemPrompt: 'System',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      // Add multiple messages
      for (let i = 1; i <= 10; i++) {
        client.setUserMessage(`Message ${i}`)
      }

      const limited = client.limitMessages(3)

      // Should have system message + 3 most recent messages
      expect(limited.length).toBe(4)
      expect(limited[0]?.role).toBe('system')
      const lastMsg = limited[limited.length - 1]
      expect(lastMsg?.content).toBe('Message 10')
    })

    it('should set and get messages', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test 1' },
        { role: 'assistant', content: 'Response 1' },
      ]

      client.setMessages(messages)
      expect(client.getMessages()).toEqual(messages)
    })
  })

  describe('Metadata', () => {
    it('should return metadata with correct structure', () => {
      const client = new Micro({
        model: 'openai:gpt-4o-mini',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      const metadata = client.getMetadata()

      expect(metadata).toHaveProperty('id')
      expect(metadata).toHaveProperty('prompt')
      expect(metadata).toHaveProperty('providerName')
      expect(metadata).toHaveProperty('model')
      expect(metadata).toHaveProperty('timing')
      expect(metadata).toHaveProperty('timestamp')
      expect(metadata).toHaveProperty('context')
    })

    it('should include reasoning metadata for reasoning models', () => {
      const client = new Micro({
        model: 'gpt-o1',
        reasoning: true,
        reasoning_effort: 'high',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-o1',
        },
      })

      const metadata = client.getMetadata()

      expect(metadata.isReasoningEnabled).toBe(true)
      expect(metadata.isReasoningModel).toBe(true)
      expect(metadata.reasoning_effort).toBe('high')
    })
  })

  describe('System Prompt', () => {
    it('should update system prompt', () => {
      const client = new Micro({
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      client.setSystemPrompt('New system prompt')
      expect(client.getSystemPrompt()).toBe('New system prompt')
    })

    it('should not add duplicate system messages', () => {
      const client = new Micro({
        systemPrompt: 'Initial prompt',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      const initialMessages = client.getMessages()
      const initialCount = initialMessages.filter(
        (m) => m.role === 'system'
      ).length

      client.setSystemPrompt('Updated prompt')

      const updatedMessages = client.getMessages()
      const updatedCount = updatedMessages.filter(
        (m) => m.role === 'system'
      ).length

      expect(updatedCount).toBe(initialCount)
    })
  })

  describe('Reasoning Models', () => {
    it('should detect OpenAI reasoning models', () => {
      const models = ['gpt-o1', 'gpt-o3', 'gpt-5']

      models.forEach((model) => {
        const client = new Micro({
          model,
          provider: {
            apiKey: 'test-key',
            baseURL: 'https://api.example.com',
            model,
          },
        })

        const metadata = client.getMetadata()
        expect(metadata.isReasoningModel).toBe(true)
      })
    })

    it('should detect Gemini reasoning models', () => {
      const client = new Micro({
        model: 'gemini-2.5-flash',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gemini-2.5-flash',
        },
      })

      const metadata = client.getMetadata()
      expect(metadata.isReasoningModel).toBe(true)
    })

    it('should detect DeepSeek reasoning models', () => {
      const models = ['deepseek-reasoner', 'deepseek-r1']

      models.forEach((model) => {
        const client = new Micro({
          model,
          provider: {
            apiKey: 'test-key',
            baseURL: 'https://api.example.com',
            model,
          },
        })

        const metadata = client.getMetadata()
        expect(metadata.isReasoningModel).toBe(true)
      })
    })
  })

  describe('Callbacks', () => {
    it('should call onMessage callback when adding messages', () => {
      const onMessage = vi.fn()
      const client = new Micro({
        onMessage,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      client.setUserMessage('Test message')
      expect(onMessage).toHaveBeenCalled()
    })

    it('should call onMessage when adding assistant message', () => {
      const onMessage = vi.fn()
      const client = new Micro({
        onMessage,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      client.setAssistantMessage('Assistant response')
      expect(onMessage).toHaveBeenCalled()
    })
  })

  describe('Image Support', () => {
    it('should handle base64 image in user message', () => {
      const client = new Micro({
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      const base64Image =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      client.setUserMessage('What is in this image?', base64Image)
      const messages = client.getMessages()
      const lastMessage = messages[messages.length - 1]

      expect(lastMessage).toBeDefined()
      if (lastMessage) {
        expect(Array.isArray(lastMessage.content)).toBe(true)
        if (Array.isArray(lastMessage.content)) {
          expect(lastMessage.content).toHaveLength(2)
          expect(lastMessage.content[0]?.type).toBe('text')
          expect(lastMessage.content[1]?.type).toBe('image_url')
        }
      }
    })
  })
})
