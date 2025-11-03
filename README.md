# Micro AI - The lightweight LLM Client

A lightweight, beginner-friendly TypeScript library for building LLM-powered applications with support for multiple providers, agentic workflows, and tool calling.

## ✨ Features

- **🔌 Multi-Provider Support** - Unified OpenAI-compatible (`/chat/completions`) interface for OpenAI, OpenRouter, Fireworks, Gemini, Anthropic (via compatible providers), Groq, DeepSeek, xAI, Mistral, Together, 302.ai and more
- **🤖 Agentic Workflows** - Built-in Agent and Orchestrator classes for autonomous AI systems
- **🛠️ Tool Calling** - Easy tool creation with automatic execution and Zod schema validation
- **🧠 Reasoning Models** - First-class support for advanced reasoning models (o1, Gemini 2.5, DeepSeek-R1)
- **💬 Conversation Management** - Automatic message history handling with context preservation
- **📝 Template Variables** - Dynamic prompt injection with context objects
- **👁️ Vision Support** - Image input capabilities for multimodal models
- **🎣 Event Hooks** - Monitor and debug LLM interactions with lifecycle callbacks
- **⚡ Streaming & Non-Streaming** - Support for both real-time token streaming and complete response modes
- **📘 TypeScript First** - Full type safety with comprehensive type definitions

## 📦 Installation

```bash
# Using npm
npm install git+https://github.com/thinnker/micro-ai-ts.git

# Using pnpm
pnpm add git+https://github.com/thinnker/micro-ai-ts.git

# Using yarn
yarn add git+https://github.com/thinnker/micro-ai-ts.git
```

## 🚀 Quick Start

### Basic Chat

```typescript
import { Micro } from 'micro-ai-ts'

// Defaults internally to 'openai:gpt-4.1-mini'
const client = new Micro()

const response = await client.chat('What is TypeScript?')
console.log(response.completion.content)
```

### Agent with Tools

```typescript
import { Agent, createTool } from 'micro-ai-ts'

// Define a tool
const weatherTool = createTool(
  'get_weather',
  'Get current weather for a location',
  z.object({
    location: z.string().describe('City and state, e.g. San Francisco, CA'),
  }),
  async ({ location }) => {
    // Your weather API logic here
    return { location, temperature: 72, condition: 'Sunny' }
  }
)

// Create an agent with the tool
const agent = Agent.create({
  name: 'Weather Assistant',
  background: 'Help users check the weather using the get_weather tool.',
  model: 'openai:gpt-4.1-mini',
  tools: [weatherTool],
})

const response = await agent.chat("What's the weather in San Francisco?")
console.log(response.completion.content)
```

### Multi-Agent Orchestration

```typescript
import { Agent, Orchestrator } from 'micro-ai-ts'

// Create specialized agents
const techSupport = Agent.create({
  name: 'Technical Support',
  background: 'Help with technical issues and troubleshooting.',
  model: 'openai:gpt-4.1-mini',
})

const billing = Agent.create({
  name: 'Billing Specialist',
  background: 'Handle billing and payment inquiries.',
  model: 'openai:gpt-4.1-mini',
})

// Create orchestrator to coordinate agents
const orchestrator = Orchestrator.create({
  name: 'Customer Service Manager',
  background: 'Route customer inquiries to the appropriate specialist.',
  model: 'openai:gpt-4.1-mini',
  handoffs: [techSupport, billing],
})

const response = await orchestrator.chat(
  'I was charged twice for my subscription.'
)
console.log(response.completion.content)
```

## 📖 Core Concepts

### Micro (Client)

The core client for direct LLM interactions with conversation management.

`Configured`

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini', // Format: "provider:model-name"
  systemPrompt: 'You are a helpful assistant. Your name is {{name}}',
  temperature: 0.7,
  maxTokens: 1000,
  context: { name: 'John' }, // Template variables
  onComplete: (result) => console.log('Response received!'),
})

// Send a message
const response = await client.chat('Hello!')

// Access response
console.log(response.completion.content) // The actual response text
console.log(response.metadata.model) // Model used
console.log(response.metadata.tokensUsed) // Token usage
console.log(response.metadata.timing) // Response time

// Streaming responses
const stream = await client.stream('Tell me a story')
for await (const chunk of stream) {
  if (!chunk.done) {
    process.stdout.write(chunk.delta) // Print each token as it arrives
  } else {
    console.log('\nFinal response:', chunk.fullContent)
  }
}

// Manage conversation
client.setSystemPrompt('New system prompt')
client.setUserMessage('Another message')
const messages = client.getMessages()
client.flushAllMessages() // Clear history if required
```

### Payload example

#### Success payload example

```json
{
  "metadata": {
    "id": "aHQkw7WTSzqOS5EqONysbw-0",
    "prompt": "Explain what a TypeScript library is in one sentence.",
    "providerName": "openai",
    "model": "gpt-5-nano",
    "tokensUsed": {
      "prompt_tokens": 31,
      "completion_tokens": 310,
      "total_tokens": 341,
      "prompt_tokens_details": {
        "cached_tokens": 0,
        "audio_tokens": 0
      },
      "completion_tokens_details": {
        "reasoning_tokens": 256,
        "audio_tokens": 0,
        "accepted_prediction_tokens": 0,
        "rejected_prediction_tokens": 0
      }
    },
    "timing": {
      "latencyMs": 4119,
      "latencySeconds": 4.119
    },
    "timestamp": "2025-10-28T13:51:40.411Z",
    "context": {},
    "isReasoningEnabled": true,
    "isReasoningModel": true,
    "reasoning_effort": "medium",
    "hasThoughts": false
  },
  "completion": {
    "role": "assistant",
    "content": "A TypeScript library is a reusable package of TypeScript (and sometimes JavaScript) code that exports APIs—functions, classes, and types—for use in other projects, typically shipped with type definitions for static type checking.",
    "reasoning": "",
    "original": "A TypeScript library is a reusable package of TypeScript (and sometimes JavaScript) code that exports APIs—functions, classes, and types—for use in other projects, typically shipped with type definitions for static type checking."
  }
}
```

### Agent

Autonomous entities with tool-calling capabilities.

```typescript
const agent = Agent.create({
  name: 'Research Assistant',
  background: 'You help users research topics using available tools.',
  model: 'openai:gpt-4.1-mini',
  tools: [searchTool, analysisTool],
  temperature: 0.5,
  onToolCall: (toolResponse) => {
    console.log(`Tool called: ${toolResponse.toolName}`)
  },
})

// Chat with the agent
const response = await agent.chat('Research TypeScript adoption trends')

// Add messages manually
agent.addPrompt('Follow-up question')
agent.addAssistantPrompt('Assistant response')

// Get conversation state
const messages = agent.getMessages()
const metadata = agent.getMetadata()
```

### Orchestrator

Specialized agent for coordinating multiple sub-agents.

```typescript
const orchestrator = Orchestrator.create({
  name: 'Team Lead',
  background: 'Coordinate specialists to handle complex tasks.',
  model: 'openai:gpt-4.1-mini',
  handoffs: [agent1, agent2, agent3], // Sub-agents
})

// The orchestrator automatically creates handoff tools
// and delegates to appropriate agents based on the query
const response = await orchestrator.chat('Complex multi-step task')
```

### Tools

Tools enable agents to perform actions beyond text generation.

```typescript
import { createTool } from 'micro-ai-ts'
import { z } from 'zod'

const calculatorTool = createTool(
  'calculator', // Tool name
  'Performs arithmetic operations', // Description
  z.object({
    // Zod schema for parameters
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  async ({ operation, a, b }) => {
    // Tool implementation
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
```

### Streaming Responses

Stream responses token-by-token for real-time output. The `.stream()` method automatically sets `stream: true` and returns an async generator.

**Please note:**

- Not all providers provide `usage` key, with token count on streaming. Providers like OpenAI, Gemini are some that dont, but same models on OpenRouter or Deepseek will provide this. Its a trial and error.

```typescript
const client = new Micro({ model: 'openrouter:openai/gpt-5-nano' })

// Stream a response
const stream = await client.stream('Write a short poem about TypeScript')

for await (const chunk of stream) {
  if (!chunk.done) {
    // Print each token as it arrives
    process.stdout.write(chunk.delta)
  } else {
    // Final chunk contains complete response and metadata
    console.log('\n\nComplete response:', chunk.fullContent)
    console.log('Latency:', chunk.metadata.timing.latencyMs, 'ms')

    // Access token usage information
    if (chunk.metadata?.tokensUsed) {
      console.log('Tokens used:', chunk.metadata.tokensUsed.total_tokens)
    }

    // For reasoning models, access the thinking process
    if (chunk.reasoning) {
      console.log('Reasoning:', chunk.reasoning)
    }
  }
}

// Streaming works with multi-turn conversations
const stream2 = await client.stream('Now make it rhyme')
for await (const chunk of stream2) {
  if (!chunk.done) process.stdout.write(chunk.delta)
}
```

**Stream vs Chat:**

- `.chat()` - Returns complete response after generation finishes (requires `stream: false`)
- `.stream()` - Returns tokens as they're generated (automatically sets `stream: true`)

## 🔧 Configuration

### Provider Configuration

Micro AI supports multiple LLM providers out of the box:

```typescript
// OpenAI (default)
const client = new Micro({ model: 'openai:gpt-4.1-mini' })

// OpenRouter
const client = new Micro({ model: 'openrouter:anthropic/claude-haiku-4.5' })

// Google Gemini
const client = new Micro({ model: 'gemini:gemini-2.5-flash-lite' })

// Groq
const client = new Micro({ model: 'groq:moonshotai/kimi-k2-instruct-0905' })

// xAI Grok
const client = new Micro({ model: 'grok:grok-4-fast' })

// DeepSeek
const client = new Micro({ model: 'deepseek:deepseek-chat' })
```

### Custom Provider

```typescript
import { createProvider } from 'micro-ai-ts'

const { provider, model } = createProvider({
  apiKey: process.env.CUSTOM_API_KEY!,
  baseURL: 'https://api.custom-provider.com/v1',
  model: 'custom-model-name',
  headers: {
    'Custom-Header': 'value',
  },
})

const client = new Micro({ provider, model })
```

### Environment Variables

Create a `.env` file with your API keys:

```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
GROQ_API_KEY=gsk_...
DEEPSEEK_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
GROK_API_KEY=sk-or-...
```

### Reasoning Models

Micro AI automatically detects and configures reasoning models:

```typescript
// OpenAI o1/o3 models
const client = new Micro({
  model: 'openai:gpt-5-nano',
  reasoning: true,
  reasoning_effort: 'medium', // 'low' | 'medium' | 'high'
})

// Google Gemini 2.5 with thinking
const client = new Micro({
  model: 'gemini:gemini-2.5-pro-exp-03-25',
  reasoning: true,
})

// DeepSeek R1
const client = new Micro({
  model: 'deepseek:deepseek-reasoner',
  reasoning: true,
})

// Access reasoning content
const response = await client.chat('Solve this complex problem...')
console.log(response.completion.reasoning) // Thinking process
console.log(response.completion.content) // Final answer
```

### Template Variables

Use template variables for dynamic prompts:

```typescript
const client = new Micro({
  systemPrompt: 'You are a {{role}}. {{instructions}}',
  context: {
    role: 'senior developer',
    background: 'Provide clear, concise code examples.',
  },
})

// Update context dynamically
client.context = { role: 'teacher', background: 'Explain concepts simply.' }
```

### Vision Support

Send images to multimodal models:

```typescript
import { encodeImageToBufferString } from 'micro-ai-ts'

const bufferString = await encodeImageToBufferString('./image.png')
const response = await client.chat("What's in this image?", bufferString)
```

## 📚 API Reference

### Micro Options

```typescript
interface MicroOptions {
  model?: string // Format: "provider:model-name"
  provider?: Provider // Custom provider config
  systemPrompt?: string // Initial system instructions
  prompt?: string // Initial user prompt
  messages?: Message[] // Pre-existing conversation
  context?: Record<string, any> // Template variables
  maxTokens?: number // Max tokens in response
  temperature?: number // 0.0 (deterministic) to 1.0 (creative)
  tools?: Tool[] // Available tools
  tool_choice?: ToolChoice // Tool selection strategy
  stream?: boolean // Enable stream (not yet implemented)
  reasoning?: boolean // Enable reasoning models
  reasoning_effort?: 'minimal' | 'low' | 'medium' | 'high'
  timeout?: number // Request timeout in ms
  debug?: boolean // Enable debug logging

  // Event hooks
  onComplete?: (result: Response) => void
  onMessage?: (messages: Message[]) => void
  onRequest?: (request: any) => void
  onResponseData?: (response: any) => void
  onError?: (error: ErrorPayload) => void
  onToolCall?: (toolResponse: ToolResponse) => void
}
```

### Micro Methods

```typescript
class Micro {
  // Core methods
  chat(prompt: string, bufferString?: string): Promise<Response>
  invoke(): Promise<Response>

  // Message management
  setUserMessage(prompt: string, bufferString?: string): void
  setAssistantMessage(prompt: string): Micro
  setSystemPrompt(prompt: string): void
  getMessages(): Message[]
  setMessages(messages: Message[]): void
  flushAllMessages(): void
  limitMessages(limit: number): Message[]

  // Metadata
  getMetadata(): Metadata
  getSystemPrompt(): string
}
```

### Agent Options

```typescript
interface AgentOptions extends Omit<MicroOptions, 'prompt'> {
  name: string // Agent role name
  background: string // Agent's purpose and behavior
  handoffs?: Agent[] // Sub-agents for delegation
}
```

### Agent Methods

```typescript
class Agent {
  // Core methods
  chat(prompt: string): Promise<Response>
  invoke(): Promise<Response>

  // Message management
  addPrompt(msg: string): void
  addAssistantPrompt(msg: string): void
  getMessages(): Message[]
  getMetadata(): Metadata

  // Static factory
  static create(options: AgentOptions): Agent
}
```

### Response Structure

```typescript
interface Response {
  metadata: {
    prompt: string
    providerName: string
    model: string
    tokensUsed?: TokenUsage
    timing: {
      latencyMs: number
      latencySeconds: number
    }
    timestamp: string
    context: Record<string, any>
    isReasoningEnabled?: boolean
    isReasoningModel?: boolean
    reasoning_effort?: ReasoningLevel
    hasThoughts?: boolean
  }
  completion: {
    role: string
    content: string // Final answer
    reasoning?: string // Thinking process (reasoning models)
    original: string // Raw response
  }
}
```

## 🎣 Event Hooks

Monitor and debug LLM interactions with lifecycle callbacks:

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',

  // Fires before API request
  onRequest: (request) => {
    console.log('Sending request:', request)
  },

  // Fires after receiving API response
  onResponseData: (response) => {
    console.log('Received response:', response)
  },

  // Fires when response is complete
  onComplete: (result) => {
    console.log('Completion:', result.completion.content)
    console.log('Tokens used:', result.metadata.tokensUsed)
  },

  // Fires when conversation history changes
  onMessage: (messages) => {
    console.log(`Conversation has ${messages.length} messages`)
  },

  // Fires when a tool is called
  onToolCall: (toolResponse) => {
    console.log(`Tool: ${toolResponse.toolName}`)
    console.log(`Result:`, toolResponse.result)
  },

  // Fires on errors
  onError: (error) => {
    console.error('Error:', error)
  },
})
```

## 📝 Examples

The library includes comprehensive examples organized by category.

### Basic

- **[simple-chat.ts](./examples/basic/simple-chat.ts)** - Basic chat interaction
- **[simple-chat-with-error.ts](./examples/basic/simple-chat-with-error.ts)** - Basic chat interaction that has error
- **[multi-turn.ts](./examples/basic/multi-turn.ts)** - Multi-turn conversations
- **[template-context.ts](./examples/basic/template-context.ts)** - Template variables
- **[event-hooks.ts](./examples/basic/event-hooks.ts)** - Event monitoring

### Streaming

- **[simple-stream.ts](./examples/stream/simple-stream.ts)** - Basic streaming
- **[simple-streaming-tokens.ts](./examples/stream/simple-streaming-tokens.ts)** - Basic streaming with token usage
- **[streaming-with-tokens.ts](./examples/stream/streaming-with-tokens.ts)** - Advanced streaming with token usage and cost estimation
- **[stream-multi-turn.ts](./examples/stream/stream-multi-turn.ts)** - Multi-turn streaming
- **[stream-with-context.ts](./examples/stream/stream-with-context.ts)** - Streaming with system prompts
- **[stream-reasoning.ts](./examples/stream/stream-reasoning.ts)** - Reasoning model streaming (o1)
- **[stream-deepseek-reasoning.ts](./examples/stream/stream-deepseek-reasoning.ts)** - DeepSeek-R1 streaming
- **[stream-comparison.ts](./examples/stream/stream-comparison.ts)** - Performance comparison

### Providers

- **[openai.ts](./examples/providers/openai.ts)** - OpenAI GPT models
- **[groq.ts](./examples/providers/groq.ts)** - Groq Llama models
- **[gemini.ts](./examples/providers/gemini.ts)** - Google Gemini
- **[openrouter.ts](./examples/providers/openrouter.ts)** - OpenRouter
- **[fireworks.ts](./examples/providers/fireworks.ts)** - Fireworks AI
- **[ai302.ts](./examples/providers/ai302.ts)** - AI302
- **[deepseek.ts](./examples/providers/deepseek.ts)** - DeepSeek

### Agent

- **[calculator](./examples/agent/calculator/)** - Math operations tool
- **[weather-assistant](./examples/agent/weather-assistant/)** - Weather and time tools
- **[database-query](./examples/agent/database-query/)** - Database query tool
- **[error-handling](./examples/agent/error-handling/)** - Tool error handling

### Orchestrator

- **[customer-service.ts](./examples/orchestrator/customer-service.ts)** - Customer service routing
- **[research-team.ts](./examples/orchestrator/research-team.ts)** - Research team with tools
- **[dev-team.ts](./examples/orchestrator/dev-team.ts)** - Development team with context

### CLI

- **[interactive-chat.ts](./examples/cli/interactive-chat.ts)** - Interactive chat session

Run examples:

```bash
# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run examples with check:example script
# Basic examples
pnpm check:example examples/basic/simple-chat.ts
pnpm check:example examples/basic/multi-turn.ts

# Streaming examples
pnpm check:example examples/stream/simple-stream.ts
pnpm check:example examples/stream/simple-streaming-tokens.ts
pnpm check:example examples/stream/streaming-with-tokens.ts
pnpm check:example examples/stream/stream-comparison.ts

# Provider examples
pnpm check:example examples/providers/openai.ts
pnpm check:example examples/providers/groq.ts
pnpm check:example examples/providers/gemini.ts
pnpm check:example examples/providers/openrouter.ts
pnpm check:example examples/providers/fireworks.ts
pnpm check:example examples/providers/ai302.ts
pnpm check:example examples/providers/deepseek.ts
pnpm check:example examples/providers/grok.ts

# Agent examples
pnpm check:example examples/agent/calculator/calculator.ts
pnpm check:example examples/agent/weather-assistant/weather-assistant.ts
pnpm check:example examples/agent/database-query/database-query.ts
pnpm check:example examples/agent/error-handling/error-handling.ts

# Orchestrator examples
pnpm check:example examples/orchestrator/customer-service.ts
pnpm check:example examples/orchestrator/research-team.ts
pnpm check:example examples/orchestrator/dev-team.ts

# CLI examples
pnpm check:example examples/cli/interactive-chat.ts

# Or run with tsx directly
pnpm dlx tsx examples/basic/simple-chat.ts
pnpm dlx tsx examples/agent/calculator/calculator.ts
pnpm dlx tsx examples/orchestrator/customer-service.ts
```

## 📖 Documentation

- **[Beginner's Guide](./docs/GUIDE.md)** - Step-by-step tutorial for getting started (coming soon)
- **[Examples](./examples/)** - Working code examples for common use cases
- **[API Reference](#-api-reference)** - Complete API documentation

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm type-check
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT

## 🙏 Acknowledgments

Micro AI is a research and learning project.
It was built by one person, whom is trying to simplify AI, Agentic and AI Orchestration workflows specifically in Javascript abd Typescript.

---

**Made with ❤️ for developers building with LLMs and pioneering AI development.**
