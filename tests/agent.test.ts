import { describe, it, expect, vi } from 'vitest'
import { Agent, Orchestrator } from '../src/agent'
import { createTool } from '../src/tools/create-tool'
import { z } from 'zod'

describe('Agent', () => {
  describe('Constructor', () => {
    it('should create agent with basic options', () => {
      const agent = new Agent({
        name: 'TestAgent',
        background: 'You are a test agent',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(agent.name).toBe('TestAgent')
      expect(agent.background).toBe('You are a test agent')
    })

    it('should initialize with tools', () => {
      const testTool = createTool(
        'test_tool',
        'A test tool',
        z.object({ input: z.string() }),
        async (params) => `Result: ${params.input}`
      )
      const agent = new Agent({
        name: 'ToolAgent',
        background: 'Agent with tools',
        tools: [testTool],
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(agent.tools).toHaveLength(1)
      expect(agent.tools?.[0]).toBe(testTool)
    })

    it('should create agent with handoffs', () => {
      const subAgent = new Agent({
        name: 'SubAgent',
        background: 'A sub agent',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      const mainAgent = new Agent({
        name: 'MainAgent',
        background: 'Main agent with handoffs',
        handoffs: [subAgent],
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(mainAgent.handoffs).toHaveLength(1)
      expect(mainAgent.handoffs?.[0]).toBe(subAgent)
    })

    it('should use static create method', () => {
      const agent = Agent.create({
        name: 'CreatedAgent',
        background: 'Created via static method',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(agent).toBeInstanceOf(Agent)
      expect(agent.name).toBe('CreatedAgent')
    })
  })

  describe('Message Management', () => {
    it('should add user prompt', () => {
      const agent = new Agent({
        name: 'TestAgent',
        background: 'Test',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      agent.addPrompt('Hello agent')
      const messages = agent.getMessages()

      const userMessage = messages.find((m) => m.role === 'user')
      expect(userMessage).toBeDefined()
      expect(userMessage?.content).toBe('Hello agent')
    })

    it('should add assistant prompt', () => {
      const agent = new Agent({
        name: 'TestAgent',
        background: 'Test',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      agent.addAssistantPrompt('Assistant response')
      const messages = agent.getMessages()

      const assistantMessage = messages.find((m) => m.role === 'assistant')
      expect(assistantMessage).toBeDefined()
      expect(assistantMessage?.content).toBe('Assistant response')
    })

    it('should retrieve messages', () => {
      const agent = new Agent({
        name: 'TestAgent',
        background: 'Test',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      agent.addPrompt('Message 1')
      agent.addPrompt('Message 2')

      const messages = agent.getMessages()
      expect(messages.length).toBeGreaterThan(0)
    })
  })

  describe('Metadata', () => {
    it('should return agent metadata', () => {
      const agent = new Agent({
        name: 'TestAgent',
        background: 'Test agent',
        model: 'gpt-4o-mini',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o-mini',
        },
      })

      const metadata = agent.getMetadata()

      expect(metadata).toHaveProperty('id')
      expect(metadata).toHaveProperty('model')
      expect(metadata).toHaveProperty('providerName')
      expect(metadata).toHaveProperty('timestamp')
    })
  })

  describe('Handoffs', () => {
    it('should convert handoff agents to tools', () => {
      const specialistAgent = new Agent({
        name: 'Specialist Agent',
        background: 'Handle specialized tasks',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      const mainAgent = new Agent({
        name: 'Main Agent',
        background: 'Coordinate tasks',
        handoffs: [specialistAgent],
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      // Handoff agents should be converted to tools internally
      expect(mainAgent.handoffs).toHaveLength(1)
    })

    it('should combine regular tools with handoff tools', () => {
      const regularTool = createTool(
        'regular_tool',
        'A regular tool',
        z.object({ input: z.string() }),
        async (params) => params.input
      )

      const handoffAgent = new Agent({
        name: 'Handoff Agent',
        background: 'Handle handoffs',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      const agent = new Agent({
        name: 'Combined Agent',
        background: 'Use both tools and handoffs',
        tools: [regularTool],
        handoffs: [handoffAgent],
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(agent.tools).toHaveLength(1)
      expect(agent.handoffs).toHaveLength(1)
    })
  })

  describe('Configuration', () => {
    it('should accept custom model', () => {
      const agent = new Agent({
        name: 'CustomModelAgent',
        background: 'Test',
        model: 'gpt-4o',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-4o',
        },
      })

      expect(agent.model).toBe('gpt-4o')
    })

    it('should accept temperature setting', () => {
      const agent = new Agent({
        name: 'TempAgent',
        background: 'Test',
        temperature: 0.7,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      // Temperature is passed to internal client
      expect(agent).toBeDefined()
    })

    it('should accept max tokens', () => {
      const agent = new Agent({
        name: 'TokenAgent',
        background: 'Test',
        maxTokens: 2000,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(agent).toBeDefined()
    })

    it('should accept reasoning options', () => {
      const agent = new Agent({
        name: 'ReasoningAgent',
        background: 'Test',
        model: 'gpt-o1', // Use a reasoning model
        reasoning: true,
        reasoning_effort: 'high',
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'gpt-o1',
        },
      })

      const metadata = agent.getMetadata()
      expect(metadata.isReasoningEnabled).toBe(true)
      expect(metadata.reasoning_effort).toBe('high')
    })
  })

  describe('Callbacks', () => {
    it('should support onComplete callback', () => {
      const onComplete = vi.fn()

      const agent = new Agent({
        name: 'CallbackAgent',
        background: 'Test',
        onComplete,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(agent).toBeDefined()
    })

    it('should support onMessage callback', () => {
      const onMessage = vi.fn()

      const agent = new Agent({
        name: 'MessageAgent',
        background: 'Test',
        onMessage,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      agent.addPrompt('Test message')
      expect(onMessage).toHaveBeenCalled()
    })

    it('should support onToolCall callback', () => {
      const onToolCall = vi.fn()

      const agent = new Agent({
        name: 'ToolCallbackAgent',
        background: 'Test',
        onToolCall,
        provider: {
          apiKey: 'test-key',
          baseURL: 'https://api.example.com',
          model: 'test-model',
        },
      })

      expect(agent).toBeDefined()
    })
  })
})

describe('Orchestrator', () => {
  it('should create orchestrator with position set', () => {
    const orchestrator = new Orchestrator({
      name: 'MainOrchestrator',
      background: 'Coordinate all agents',
      provider: {
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
        model: 'test-model',
      },
    })

    expect(orchestrator).toBeInstanceOf(Orchestrator)
    expect(orchestrator).toBeInstanceOf(Agent)
    expect(orchestrator.position).toBe('orchestrator')
  })

  it('should use static create method', () => {
    const orchestrator = Orchestrator.create({
      name: 'CreatedOrchestrator',
      background: 'Created via static method',
      provider: {
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
        model: 'test-model',
      },
    })

    expect(orchestrator).toBeInstanceOf(Orchestrator)
    expect(orchestrator.position).toBe('orchestrator')
  })

  it('should support handoffs like regular agent', () => {
    const workerAgent = new Agent({
      name: 'Worker',
      background: 'Do work',
      provider: {
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
        model: 'test-model',
      },
    })

    const orchestrator = new Orchestrator({
      name: 'Coordinator',
      background: 'Coordinate workers',
      handoffs: [workerAgent],
      provider: {
        apiKey: 'test-key',
        baseURL: 'https://api.example.com',
        model: 'test-model',
      },
    })

    expect(orchestrator.handoffs).toHaveLength(1)
  })
})
