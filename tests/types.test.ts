import { describe, it, expect } from 'vitest'
import type {
  Provider,
  Tool,
  Message,
  ToolCall,
  ToolChoice,
  ReasoningLevel,
  TokenUsage,
  Metadata,
  ErrorPayload,
  Response,
  ContentPart,
} from '../src/types'

describe('Type Definitions', () => {
  describe('Provider', () => {
    it('should accept valid provider configuration', () => {
      const provider: Provider = {
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
        model: 'test-model',
      }

      expect(provider.apiKey).toBe('test-key')
      expect(provider.baseURL).toBe('https://api.example.com')
      expect(provider.model).toBe('test-model')
    })

    it('should accept provider with headers', () => {
      const provider: Provider = {
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
        model: 'test-model',
        headers: {
          'X-Custom': 'value',
        },
      }

      expect(provider.headers).toEqual({ 'X-Custom': 'value' })
    })
  })

  describe('Message', () => {
    it('should accept user message with string content', () => {
      const message: Message = {
        role: 'user',
        content: 'Hello',
      }

      expect(message.role).toBe('user')
      expect(message.content).toBe('Hello')
    })

    it('should accept message with null content', () => {
      const message: Message = {
        role: 'assistant',
        content: null,
      }

      expect(message.content).toBeNull()
    })

    it('should accept message with content parts', () => {
      const message: Message = {
        role: 'user',
        content: [
          { type: 'text', text: 'Hello' },
          {
            type: 'image_url',
            image_url: { url: 'data:image/png;base64,abc' },
          },
        ],
      }

      expect(Array.isArray(message.content)).toBe(true)
      expect(message.content).toHaveLength(2)
    })

    it('should accept tool message', () => {
      const message: Message = {
        role: 'tool',
        content: 'Tool result',
        tool_call_id: 'call_123',
        name: 'test_tool',
      }

      expect(message.role).toBe('tool')
      expect(message.tool_call_id).toBe('call_123')
      expect(message.name).toBe('test_tool')
    })

    it('should accept message with tool calls', () => {
      const toolCall: ToolCall = {
        id: 'call_123',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: '{"location":"NYC"}',
        },
      }

      const message: Message = {
        role: 'assistant',
        content: null,
        tool_calls: [toolCall],
      }

      expect(message.tool_calls).toHaveLength(1)
      const firstToolCall = message.tool_calls?.[0]
      expect(firstToolCall?.function.name).toBe('get_weather')
    })
  })

  describe('ContentPart', () => {
    it('should accept text content part', () => {
      const part: ContentPart = {
        type: 'text',
        text: 'Hello world',
      }

      expect(part.type).toBe('text')
      if (part.type === 'text') {
        expect(part.text).toBe('Hello world')
      }
    })

    it('should accept image_url content part', () => {
      const part: ContentPart = {
        type: 'image_url',
        image_url: {
          url: 'https://example.com/image.png',
        },
      }

      expect(part.type).toBe('image_url')
      if (part.type === 'image_url') {
        expect(part.image_url.url).toBe('https://example.com/image.png')
      }
    })
  })

  describe('ToolChoice', () => {
    it('should accept string tool choice', () => {
      const choices: ToolChoice[] = ['auto', 'none', 'required']

      choices.forEach((choice) => {
        expect(['auto', 'none', 'required']).toContain(choice)
      })
    })

    it('should accept function tool choice', () => {
      const choice: ToolChoice = {
        type: 'function',
        function: { name: 'get_weather' },
      }

      expect(choice.type).toBe('function')
      if (typeof choice !== 'string') {
        expect(choice.function.name).toBe('get_weather')
      }
    })
  })

  describe('ReasoningLevel', () => {
    it('should accept valid reasoning levels', () => {
      const levels: ReasoningLevel[] = ['minimal', 'low', 'medium', 'high']

      levels.forEach((level) => {
        expect(['minimal', 'low', 'medium', 'high']).toContain(level)
      })
    })
  })

  describe('TokenUsage', () => {
    it('should accept token usage data', () => {
      const usage: TokenUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      }

      expect(usage.prompt_tokens).toBe(100)
      expect(usage.completion_tokens).toBe(50)
      expect(usage.total_tokens).toBe(150)
    })

    it('should accept partial token usage', () => {
      const usage: TokenUsage = {
        total_tokens: 150,
      }

      expect(usage.total_tokens).toBe(150)
      expect(usage.prompt_tokens).toBeUndefined()
    })
  })

  describe('Metadata', () => {
    it('should accept complete metadata', () => {
      const metadata: Metadata = {
        id: 'test-id',
        prompt: 'Test prompt',
        providerName: 'openai',
        model: 'gpt-4o-mini',
        tokensUsed: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        timing: {
          latencyMs: 1000,
          latencySeconds: 1,
        },
        timestamp: new Date().toISOString(),
        context: { key: 'value' },
      }

      expect(metadata.id).toBe('test-id')
      expect(metadata.model).toBe('gpt-4o-mini')
      expect(metadata.timing.latencyMs).toBe(1000)
    })

    it('should accept metadata with reasoning fields', () => {
      const metadata: Metadata = {
        id: 'test-id',
        prompt: 'Test',
        providerName: 'openai',
        model: 'gpt-o1',
        timing: { latencyMs: 1000, latencySeconds: 1 },
        timestamp: new Date().toISOString(),
        context: {},
        isReasoningEnabled: true,
        isReasoningModel: true,
        reasoning_effort: 'high',
        hasThoughts: true,
      }

      expect(metadata.isReasoningEnabled).toBe(true)
      expect(metadata.reasoning_effort).toBe('high')
      expect(metadata.hasThoughts).toBe(true)
    })
  })

  describe('ErrorPayload', () => {
    it('should accept timeout error', () => {
      const error: ErrorPayload = {
        type: 'timeout',
        message: 'Request timed out',
        code: 'ECONNABORTED',
      }

      expect(error.type).toBe('timeout')
      expect(error.message).toBe('Request timed out')
    })

    it('should accept API error with details', () => {
      const error: ErrorPayload = {
        type: 'api_error',
        message: 'Invalid request',
        status: 400,
        code: 'invalid_request',
        details: { param: 'model', message: 'Invalid model' },
      }

      expect(error.type).toBe('api_error')
      expect(error.status).toBe(400)
      expect(error.details).toBeDefined()
    })
  })

  describe('Response', () => {
    it('should accept successful response', () => {
      const response: Response = {
        metadata: {
          id: 'test-id',
          prompt: 'Test',
          providerName: 'openai',
          model: 'gpt-4o-mini',
          timing: { latencyMs: 1000, latencySeconds: 1 },
          timestamp: new Date().toISOString(),
          context: {},
        },
        completion: {
          role: 'assistant',
          content: 'Response content',
          original: 'Response content',
        },
      }

      expect(response.completion.content).toBe('Response content')
      expect(response.error).toBeUndefined()
    })

    it('should accept response with reasoning', () => {
      const response: Response = {
        metadata: {
          id: 'test-id',
          prompt: 'Test',
          providerName: 'openai',
          model: 'gpt-o1',
          timing: { latencyMs: 1000, latencySeconds: 1 },
          timestamp: new Date().toISOString(),
          context: {},
          isReasoningModel: true,
          hasThoughts: true,
        },
        completion: {
          role: 'assistant',
          content: 'Final answer',
          reasoning: 'Thinking process',
          original: '<thinking>Thinking process</thinking>Final answer',
        },
      }

      expect(response.completion.reasoning).toBe('Thinking process')
      expect(response.completion.content).toBe('Final answer')
    })

    it('should accept error response', () => {
      const response: Response = {
        metadata: {
          id: 'test-id',
          prompt: 'Test',
          providerName: 'openai',
          model: 'gpt-4o-mini',
          timing: { latencyMs: 500, latencySeconds: 0.5 },
          timestamp: new Date().toISOString(),
          context: {},
        },
        completion: {
          role: 'assistant',
          content: '',
          original: '',
        },
        error: {
          type: 'api_error',
          message: 'API error occurred',
          status: 500,
        },
      }

      expect(response.error).toBeDefined()
      expect(response.error?.type).toBe('api_error')
      expect(response.completion.content).toBe('')
    })
  })

  describe('Tool', () => {
    it('should accept valid tool definition', () => {
      const tool: Tool = {
        schema: {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get weather information',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' },
              },
              required: ['location'],
              additionalProperties: false,
            },
          },
        },
        execute: async (args: any) => `Weather in ${args.location}`,
      }

      expect(tool.schema.function.name).toBe('get_weather')
      expect(tool.schema.function.parameters.required).toContain('location')
    })
  })
})
