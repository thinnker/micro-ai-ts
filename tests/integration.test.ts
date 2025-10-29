import { describe, it, expect, vi } from 'vitest'
import { Micro, Agent, Orchestrator, createTool, z } from '../src/index'

describe('Integration Tests', () => {
  describe('Micro with Tools', () => {
    it('should initialize with tools and callbacks', () => {
      const weatherTool = createTool(
        'get_weather',
        'Get weather information',
        z.object({
          location: z.string().describe('City name'),
          unit: z.enum(['celsius', 'fahrenheit']).optional(),
        }),
        async ({ location, unit = 'celsius' }) => {
          return `Weather in ${location}: 22°${unit === 'celsius' ? 'C' : 'F'}`
        }
      )

      const onToolCall = vi.fn()
      const onMessage = vi.fn()

      const client = new Micro({
        model: 'gpt-4o-mini',
        tools: [weatherTool],
        onToolCall,
        onMessage,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      expect(client).toBeDefined()
      expect(client.getMetadata().model).toBe('gpt-4o-mini')
    })

    it('should handle context variables in prompts', () => {
      const client = new Micro({
        systemPrompt: 'You are a {{role}} assistant',
        context: { role: 'helpful' },
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(client.getSystemPrompt()).toBe('You are a helpful assistant')
    })

    it('should support message history management', () => {
      const client = new Micro({
        systemPrompt: 'You are helpful',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      client.setUserMessage('First question')
      client.setAssistantMessage('First answer')
      client.setUserMessage('Second question')
      client.setAssistantMessage('Second answer')

      const messages = client.getMessages()
      expect(messages.length).toBeGreaterThan(2)

      // Limit to last 2 messages (plus system)
      const limited = client.limitMessages(2)
      expect(limited.length).toBe(3) // system + 2 messages
    })
  })

  describe('Agent with Tools', () => {
    it('should create agent with multiple tools', () => {
      const calculatorTool = createTool(
        'calculator',
        'Perform calculations',
        z.object({
          operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
          a: z.number(),
          b: z.number(),
        }),
        async ({ operation, a, b }) => {
          switch (operation) {
            case 'add':
              return a + b
            case 'subtract':
              return a - b
            case 'multiply':
              return a * b
            case 'divide':
              return a / b
          }
        }
      )

      const searchTool = createTool(
        'search',
        'Search for information',
        z.object({
          query: z.string(),
        }),
        async ({ query }) => `Search results for: ${query}`
      )

      const agent = new Agent({
        name: 'Multi-Tool Agent',
        instructions: 'You can calculate and search',
        tools: [calculatorTool, searchTool],
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      expect(agent.tools).toHaveLength(2)
      expect(agent.name).toBe('Multi-Tool Agent')
    })

    it('should support agent handoffs', () => {
      const researchAgent = new Agent({
        name: 'Research Specialist',
        instructions: 'Research topics in depth',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      const writingAgent = new Agent({
        name: 'Writing Specialist',
        instructions: 'Write clear and concise content',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      const coordinator = new Agent({
        name: 'Coordinator',
        instructions: 'Coordinate between specialists',
        handoffs: [researchAgent, writingAgent],
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      expect(coordinator.handoffs).toHaveLength(2)
    })
  })

  describe('Orchestrator Pattern', () => {
    it('should create orchestrator with worker agents', () => {
      const dataAgent = new Agent({
        name: 'Data Analyst',
        instructions: 'Analyze data and provide insights',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      const reportAgent = new Agent({
        name: 'Report Writer',
        instructions: 'Write comprehensive reports',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      const orchestrator = new Orchestrator({
        name: 'Project Manager',
        instructions: 'Manage the workflow between agents',
        handoffs: [dataAgent, reportAgent],
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      expect(orchestrator.position).toBe('orchestrator')
      expect(orchestrator.handoffs).toHaveLength(2)
    })
  })

  describe('Reasoning Models', () => {
    it('should configure reasoning models correctly', () => {
      const reasoningModels = [
        'gpt-o1',
        'gpt-o3',
        'gemini-2.5-flash',
        'deepseek-reasoner',
        'deepseek-r1',
        'qwq-32b',
      ]

      reasoningModels.forEach((model) => {
        const client = new Micro({
          model,
          reasoning: true,
          reasoning_effort: 'high',
          provider: {
            apiKey: 'test-key',
            baseURL: 'https://api.example.com',
            model,
          },
        })

        const metadata = client.getMetadata()
        expect(metadata.isReasoningModel).toBe(true)
        expect(metadata.isReasoningEnabled).toBe(true)
        expect(metadata.reasoning_effort).toBe('high')
      })
    })

    it('should support different reasoning effort levels', () => {
      const efforts: Array<'minimal' | 'low' | 'medium' | 'high'> = [
        'minimal',
        'low',
        'medium',
        'high',
      ]

      efforts.forEach((effort) => {
        const client = new Micro({
          model: 'gpt-o1',
          reasoning: true,
          reasoning_effort: effort,
          provider: {
            apiKey: 'test-key',
            baseURL: 'https://api.example.com',
            model: 'gpt-o1',
          },
        })

        const metadata = client.getMetadata()
        expect(metadata.reasoning_effort).toBe(effort)
      })
    })
  })

  describe('Callbacks and Lifecycle', () => {
    it('should trigger all lifecycle callbacks', () => {
      const onComplete = vi.fn()
      const onMessage = vi.fn()
      const onRequest = vi.fn()
      const onResponseData = vi.fn()
      const onError = vi.fn()
      const onToolCall = vi.fn()

      const client = new Micro({
        model: 'gpt-4o-mini',
        onComplete,
        onMessage,
        onRequest,
        onResponseData,
        onError,
        onToolCall,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      client.setUserMessage('Test message')
      expect(onMessage).toHaveBeenCalled()
    })

    it('should support agent callbacks', () => {
      const onMessage = vi.fn()
      const onToolCall = vi.fn()

      const agent = new Agent({
        name: 'Callback Agent',
        instructions: 'Test callbacks',
        onMessage,
        onToolCall,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      agent.addPrompt('Test prompt')
      expect(onMessage).toHaveBeenCalled()
    })
  })

  describe('Provider Configuration', () => {
    it('should support provider:model format', () => {
      const client = new Micro({
        model: 'openai:gpt-4o-mini',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      const metadata = client.getMetadata()
      expect(metadata.providerName).toBe('openai')
      expect(metadata.model).toBe('gpt-4o-mini')
    })

    it('should support custom headers', () => {
      const client = new Micro({
        model: 'test-model',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
          headers: {
            'X-Custom-Header': 'custom-value',
            'X-Organization': 'my-org',
          },
        },
      })

      expect(client).toBeDefined()
    })
  })

  describe('Complex Tool Schemas', () => {
    it('should handle nested object schemas', () => {
      const complexTool = createTool(
        'complex_operation',
        'Perform complex operation',
        z.object({
          user: z.object({
            name: z.string(),
            email: z.string().email(),
            age: z.number().min(0).max(120),
          }),
          preferences: z.object({
            theme: z.enum(['light', 'dark']),
            notifications: z.boolean(),
          }),
          tags: z.array(z.string()),
        }),
        async (params) => {
          return {
            success: true,
            user: params.user.name,
            preferences: params.preferences,
          }
        }
      )

      expect(complexTool.schema.function.name).toBe('complex_operation')
      expect(complexTool.schema.function.parameters.properties).toBeDefined()
    })

    it('should handle optional and default values', () => {
      const tool = createTool(
        'flexible_tool',
        'Tool with optional params',
        z.object({
          required: z.string(),
          optional: z.string().optional(),
          withDefault: z.number().default(42),
        }),
        async (params) => params
      )

      const required = tool.schema.function.parameters.required
      expect(required).toContain('required')
      expect(required).not.toContain('optional')
    })
  })

  describe('Error Handling', () => {
    it('should handle timeout configuration', () => {
      const client = new Micro({
        model: 'gpt-4o-mini',
        timeout: 5000,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      expect(client).toBeDefined()
    })

    it('should support debug mode', () => {
      const client = new Micro({
        model: 'gpt-4o-mini',
        debug: true,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      expect(client).toBeDefined()
    })
  })

  describe('Temperature and Token Configuration', () => {
    it('should accept temperature settings', () => {
      const temperatures = [0, 0.5, 0.7, 1.0, 1.5, 2.0]

      temperatures.forEach((temp) => {
        const client = new Micro({
          model: 'gpt-4o-mini',
          temperature: temp,
          provider: {
            apiKey: 'test-key',
            baseURL: 'https://api.example.com',
            model: 'gpt-4o-mini',
          },
        })

        expect(client).toBeDefined()
      })
    })

    it('should accept max tokens configuration', () => {
      const client = new Micro({
        model: 'gpt-4o-mini',
        maxTokens: 2000,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      expect(client).toBeDefined()
    })
  })
})
