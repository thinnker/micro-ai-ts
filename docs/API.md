# API Reference

Complete API documentation for Micro AI.

## Table of Contents

- [Micro (Client)](#micro-client)
  - [Constructor Options](#micro-options)
  - [Methods](#micro-methods)
  - [Response Structure](#response-structure)
- [Agent](#agent)
  - [Constructor Options](#agent-options)
  - [Methods](#agent-methods)
- [Orchestrator](#orchestrator)
- [Tools](#tools)
- [Streaming](#streaming)
- [Event Hooks](#event-hooks)
- [Types](#types)

---

## Micro (Client)

The core client for direct LLM interactions with conversation management.

### Micro Options

```typescript
interface MicroOptions {
  // Model Configuration
  model?: string // Format: "provider:model-name" (default: "openai:gpt-4.1-mini")
  provider?: Provider // Custom provider config

  // Prompt Configuration
  systemPrompt?: string // Initial system instructions
  prompt?: string // Initial user prompt
  messages?: Message[] // Pre-existing conversation
  context?: Record<string, any> // Template variables for dynamic prompts

  // Generation Parameters
  maxTokens?: number // Max tokens in response
  temperature?: number // 0.0 (deterministic) to 1.0 (creative)
  top_p?: number // Nucleus sampling parameter
  top_k?: number // Top-k sampling parameter
  presence_penalty?: number // Penalize new tokens based on presence
  frequency_penalty?: number // Penalize new tokens based on frequency

  // Tool Configuration
  tools?: Tool[] // Available tools for the model
  tool_choice?: ToolChoice // Tool selection strategy

  // Streaming
  stream?: boolean // Enable streaming responses

  // Reasoning Models
  reasoning?: boolean // Enable reasoning mode
  reasoning_effort?: ReasoningLevel // 'minimal' | 'low' | 'medium' | 'high'

  // Advanced
  timeout?: number // Request timeout in milliseconds
  debug?: boolean // Enable debug logging
  override?: LlmParams & Record<string, any> // Override any parameter

  // Event Hooks
  onComplete?: (result: Response, messages?: Message[]) => void
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
  // Core Methods

  /**
   * Send a message and get a complete response
   * @param prompt - The user message
   * @param bufferString - Optional base64 image string for vision models
   * @returns Promise<Response>
   */
  chat(prompt: string, bufferString?: string): Promise<Response>

  /**
   * Invoke the LLM with current conversation state
   * @returns Promise<Response>
   */
  invoke(): Promise<Response>

  /**
   * Stream a response token-by-token
   * @param prompt - The user message
   * @param bufferString - Optional base64 image string for vision models
   * @returns AsyncGenerator<StreamChunk>
   */
  stream(prompt: string, bufferString?: string): Promise<StreamResponse>

  // Message Management

  /**
   * Add a user message to the conversation
   * @param prompt - The user message
   * @param bufferString - Optional base64 image string
   */
  setUserMessage(prompt: string, bufferString?: string): void

  /**
   * Add an assistant message to the conversation
   * @param prompt - The assistant message
   * @returns this (for chaining)
   */
  setAssistantMessage(prompt: string): Micro

  /**
   * Set or update the system prompt
   * @param prompt - The system prompt
   */
  setSystemPrompt(prompt: string): void

  /**
   * Get the current system prompt
   * @returns string
   */
  getSystemPrompt(): string

  /**
   * Get all messages in the conversation
   * @returns Message[]
   */
  getMessages(): Message[]

  /**
   * Replace all messages in the conversation
   * @param messages - New message array
   */
  setMessages(messages: Message[]): void

  /**
   * Clear all messages from the conversation
   */
  flushAllMessages(): void

  /**
   * Limit conversation to most recent N messages (preserves system messages)
   * @param limit - Number of non-system messages to keep (default: 5)
   * @returns Message[]
   */
  limitMessages(limit?: number): Message[]

  // Metadata

  /**
   * Get metadata about the current client state
   * @returns Metadata
   */
  getMetadata(): Metadata
}
```

### Response Structure

```typescript
interface Response {
  metadata: {
    id: string // Unique identifier for this interaction
    prompt: string // The user prompt that was sent
    providerName: string // Provider used (e.g., "openai", "gemini")
    model: string // Model name (e.g., "gpt-4.1-mini")
    tokensUsed?: TokenUsage // Token usage information
    timing: {
      latencyMs: number // Response time in milliseconds
      latencySeconds: number // Response time in seconds
    }
    timestamp: string // ISO timestamp
    context: Record<string, any> // Template context used
    isReasoningEnabled?: boolean // Whether reasoning was enabled
    isReasoningModel?: boolean // Whether model supports reasoning
    reasoning_effort?: ReasoningLevel // Reasoning effort level used
    hasThoughts?: boolean // Whether response includes reasoning
  }
  completion: {
    role: string // "assistant"
    content: string // The final response text
    reasoning?: string // Thinking process (reasoning models only)
    original: string // Raw response before processing
  }
  error?: ErrorPayload // Error information if request failed
  fullResponse?: Record<string, unknown> // Complete API response
}
```

---

## Agent

Autonomous entities with tool-calling capabilities and specialized roles.

### Agent Options

```typescript
interface AgentOptions extends Omit<MicroOptions, 'prompt'> {
  name: string // Agent role name (e.g., "Research Assistant")
  background: string // Agent's purpose and behavior
  goal?: string // Specific goal or objective
  position?: string // Internal position identifier
  additionalInstructions?: string // Extra instructions for the agent
  handoffs?: Agent[] // Sub-agents for delegation
}
```

### Agent Methods

```typescript
class Agent {
  // Core Methods

  /**
   * Send a message to the agent and get a response
   * @param prompt - The user message
   * @returns Promise<Response>
   */
  chat(prompt: string): Promise<Response>

  /**
   * Invoke the agent with current conversation state
   * @returns Promise<Response>
   */
  invoke(): Promise<Response>

  // Message Management

  /**
   * Add a user message to the agent's conversation
   * @param msg - The user message
   */
  addPrompt(msg: string): void

  /**
   * Add an assistant message to the agent's conversation
   * @param msg - The assistant message
   */
  addAssistantPrompt(msg: string): void

  /**
   * Get all messages in the agent's conversation
   * @returns Message[]
   */
  getMessages(): Message[]

  /**
   * Get metadata about the agent's current state
   * @returns Metadata
   */
  getMetadata(): Metadata

  // Static Factory

  /**
   * Create a new agent instance
   * @param options - Agent configuration
   * @returns Agent
   */
  static create(options: AgentOptions): Agent
}
```

---

## Orchestrator

Specialized agent for coordinating multiple sub-agents. Inherits all Agent methods and properties.

```typescript
class Orchestrator extends Agent {
  /**
   * Create a new orchestrator instance
   * @param options - Orchestrator configuration (same as AgentOptions)
   * @returns Orchestrator
   */
  static create(options: AgentOptions): Orchestrator
}
```

**Key Features:**

- Automatically creates handoff tools for each sub-agent
- Routes requests to appropriate agents based on query
- Coordinates multi-agent workflows

---

## Tools

Tools enable agents to perform actions beyond text generation.

### Creating Tools

```typescript
import { createTool } from 'micro-ai-ts'
import { z } from 'zod'

const tool = createTool(
  name: string,              // Tool name (e.g., "calculator")
  description: string,       // What the tool does
  schema: ZodObject,         // Zod schema for parameters
  execute: (args) => any     // Implementation function
)
```

### Tool Structure

```typescript
interface Tool {
  schema: {
    type: 'function'
    function: {
      name: string
      description: string
      parameters: {
        type: 'object'
        properties?: Record<string, any>
        required?: string[]
        additionalProperties: boolean
      }
    }
  }
  execute: (args: any) => any
}
```

### Example

```typescript
const weatherTool = createTool(
  'get_weather',
  'Get current weather for a location',
  z.object({
    location: z.string().describe('City and state, e.g. San Francisco, CA'),
    units: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  async ({ location, units = 'celsius' }) => {
    // Your implementation
    return { location, temperature: 72, condition: 'Sunny', units }
  }
)
```

---

## Streaming

Stream responses token-by-token for real-time output.

### Stream Method

```typescript
const stream = await client.stream('Your prompt here')

for await (const chunk of stream) {
  if (!chunk.done) {
    // Process each token as it arrives
    process.stdout.write(chunk.delta)
  } else {
    // Final chunk with complete response
    console.log('\nComplete:', chunk.fullContent)
    console.log('Metadata:', chunk.metadata)
  }
}
```

### StreamChunk Structure

```typescript
interface StreamChunk {
  delta: string // Current token
  fullContent: string // Accumulated content so far
  reasoning?: string // Reasoning content (if applicable)
  done: boolean // Whether streaming is complete
  metadata?: Metadata // Available only in final chunk
  completion?: {
    // Available only in final chunk
    role: string
    content: string
    reasoning?: string
    original: string
  }
}
```

**Notes:**

- `.stream()` automatically sets `stream: true`
- Not all providers return token usage during streaming
- Streaming works with multi-turn conversations
- For reasoning models, reasoning content is included in chunks

---

## Event Hooks

Monitor and debug LLM interactions with lifecycle callbacks.

### Available Hooks

```typescript
const client = new Micro({
  // Fires before API request is sent
  onRequest: (request: any) => void

  // Fires after receiving raw API response
  onResponseData: (response: any) => void

  // Fires when response processing is complete
  onComplete: (result: Response, messages?: Message[]) => void

  // Fires when conversation history changes
  onMessage: (messages: Message[]) => void

  // Fires when a tool is called
  onToolCall: (toolResponse: ToolResponse) => void

  // Fires on errors
  onError: (error: ErrorPayload) => void
})
```

### ToolResponse Structure

```typescript
interface ToolResponse {
  toolName: string // Name of the tool called
  arguments: string // Arguments passed to the tool
  result: string | null // Tool execution result
  error?: string // Error message if tool failed
}
```

---

## Types

### Core Types

```typescript
// Provider configuration
type Provider = {
  apiKey: string
  baseURL: string
  model: string
  headers?: Record<string, string>
}

// Message structure
type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

interface Message {
  id?: string
  role: MessageRole
  content: string | null | ContentPart[]
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

// Content parts for multimodal messages
type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

// Tool calling
type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

type ToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'function'; function: { name: string } }

// Reasoning
type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high'

// Token usage
type TokenUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

// Errors
type ErrorPayloadType = 'timeout' | 'api_error'

type ErrorPayload = {
  type: ErrorPayloadType
  message: string
  status?: number
  code?: string
  details?: any
}
```

### Model Capabilities

```typescript
type ModelCapabilities = {
  isOpenAI5: boolean // GPT-5 models
  isOpenAIReasoning: boolean // o1/o3/o4 models
  isGemini25Reasoning: boolean // Gemini 2.5 models
  isGLMReasoning: boolean // GLM-4 models
  isQWQ: boolean // QWQ models
  isDeepseekReasoning: boolean // DeepSeek R1/Reasoner
  isQwen3: boolean // Qwen3 models
  isMinimaxM2: boolean // Minimax M2 models
  isReasoningModel: boolean // Any reasoning model
}
```

---

## Provider Configuration

### Built-in Providers

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

---

## Utility Functions

### Template Parsing

```typescript
import { parseTemplate } from 'micro-ai-ts'

const template = 'Hello {{name}}, you are {{age}} years old'
const result = parseTemplate(template, { name: 'John', age: 30 })
// Result: "Hello John, you are 30 years old"
```

### Image Encoding

```typescript
import fs from 'fs'

// Read image and convert to base64 data URL
const imageBuffer = fs.readFileSync('./image.png')
const base64Image = imageBuffer.toString('base64')
const bufferString = `data:image/png;base64,${base64Image}`

const response = await client.chat("What's in this image?", bufferString)
```

### Other Utilities

```typescript
import { slugify, randomId } from 'micro-ai-ts'

const slug = slugify('Hello World!') // "hello-world"
const id = randomId() // "abc123xyz"
```

---

## HTTP Client

Micro AI includes a built-in HTTP client for making requests.

```typescript
import { httpClient, get, post, put, patch, del } from 'micro-ai-ts'

// Using httpClient
const response = await httpClient({
  baseURL: 'https://api.example.com',
  endpoint: '/users',
  method: 'GET',
  headers: { Authorization: 'Bearer token' },
  timeout: 5000,
})

// Using convenience methods
const users = await get('https://api.example.com/users')
const newUser = await post('https://api.example.com/users', { name: 'John' })
```

---

For more examples and use cases, see the [examples directory](./examples/) in the repository.
