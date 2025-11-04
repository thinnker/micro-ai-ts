# Streaming API

The `.stream()` method provides real-time token-by-token streaming of LLM responses with automatic tool calling support.

## Overview

- **Method**: `async stream(prompt: string, bufferString?: string): Promise<StreamResponse>`
- **Automatically sets**: `stream: true`
- **Returns**: AsyncGenerator that yields chunks as they arrive
- **Tool Support**: Automatically handles tool calls during streaming
- **Max Iterations**: Configurable via `maxToolInterations` (default: 10)

## Basic Usage

```typescript
import { Micro } from 'micro-ai-ts'

const client = new Micro({ model: 'openai:gpt-4o-mini' })

const stream = await client.stream('Tell me a story')

for await (const chunk of stream) {
  if (!chunk.done) {
    // Print each token as it arrives
    process.stdout.write(chunk.delta)
  } else {
    // Final chunk contains complete response
    console.log('\nComplete:', chunk.fullContent)
  }
}
```

## Streaming with Tools

Tools are automatically executed during streaming. The tool calls happen transparently in the background, and only the final response is yielded to the user.

```typescript
import { Micro, createTool } from 'micro-ai-ts'
import { z } from 'zod'

const calculatorTool = createTool(
  'calculator',
  'Performs arithmetic operations',
  z.object({
    operation: z.enum(['add', 'multiply']),
    a: z.number(),
    b: z.number(),
  }),
  async ({ operation, a, b }) => {
    return operation === 'add' ? a + b : a * b
  }
)

const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools: [calculatorTool],
  maxToolInterations: 10, // Optional: limit tool call chains
})

const stream = await client.stream('What is 150 + 300? Then multiply by 2.')

for await (const chunk of stream) {
  if (!chunk.done) {
    // Only the final response is streamed, not tool calls
    process.stdout.write(chunk.delta)
  } else {
    console.log('\nComplete:', chunk.fullContent)
  }
}
```

## StreamChunk Type

Each chunk yielded by the stream has the following structure:

```typescript
type StreamChunk = {
  delta: string // The new token(s) received
  fullContent: string // Accumulated content so far
  reasoning?: string // Extracted reasoning (for reasoning models)
  done: boolean // True for the final chunk
  metadata?: Metadata // Only present in final chunk
  completion?: {
    // Only present in final chunk
    role: string
    content: string
    reasoning?: string
    original: string
  }
}
```

## Multi-Turn Conversations

Streaming maintains conversation history just like `.chat()`:

```typescript
const stream1 = await client.stream('What is 2+2?')
for await (const chunk of stream1) {
  if (!chunk.done) process.stdout.write(chunk.delta)
}

const stream2 = await client.stream('Multiply that by 3')
for await (const chunk of stream2) {
  if (!chunk.done) process.stdout.write(chunk.delta)
}

console.log('Messages:', client.getMessages().length) // 5 (system + 2 user + 2 assistant)
```

## Reasoning Models

For reasoning models (o1, Gemini 2.5, DeepSeek-R1), the reasoning process is automatically extracted:

```typescript
const client = new Micro({
  model: 'openai:gpt-5-nano',
  reasoning: true,
})

const stream = await client.stream('Solve this logic puzzle...')

for await (const chunk of stream) {
  if (!chunk.done) {
    process.stdout.write(chunk.delta)
  } else {
    if (chunk.reasoning) {
      console.log('\n\nReasoning:', chunk.reasoning)
    }
    console.log('Answer:', chunk.fullContent)
  }
}
```

## Comparison: .stream() vs .chat()

| Feature             | `.stream()`              | `.chat()`                |
| ------------------- | ------------------------ | ------------------------ |
| Response timing     | Token-by-token           | Complete response        |
| Stream setting      | Automatic `stream: true` | Requires `stream: false` |
| Return type         | AsyncGenerator           | Promise<Response>        |
| Use case            | Real-time UI updates     | Batch processing         |
| Time to first token | Faster                   | N/A                      |

## Tool Call Behavior

When streaming with tools:

1. The model decides if it needs to call a tool
2. Tool calls are executed automatically in the background
3. Results are fed back to the model
4. The model generates the final response
5. Only the final response is streamed to the user

This creates a seamless experience where tool calls are transparent to the end user.

### Monitoring Tool Calls

Use the `onToolCall` hook to monitor tool executions during streaming:

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools: [calculatorTool],
  onToolCall: (toolResponse) => {
    console.log(`\n[Tool Called]: ${toolResponse.toolName}`)
    console.log(`[Arguments]: ${JSON.stringify(toolResponse.arguments)}`)
    console.log(`[Result]: ${toolResponse.result}`)
  },
})

const stream = await client.stream('Calculate 25 * 4 and tell me about it')

for await (const chunk of stream) {
  if (!chunk.done) process.stdout.write(chunk.delta)
}
```

## Examples

See the `examples/stream/` directory for complete examples:

- `simple-stream.ts` - Basic streaming
- `simple-stream-with-tools.ts` - Streaming with automatic tool calling
- `stream-multi-turn.ts` - Multi-turn conversations
- `stream-with-context.ts` - Streaming with system prompts
- `stream-reasoning.ts` - Reasoning model streaming (o1)
- `stream-deepseek-reasoning.ts` - DeepSeek-R1 streaming
- `stream-comparison.ts` - Performance comparison

## Error Handling

```typescript
try {
  const stream = await client.stream('Hello')

  for await (const chunk of stream) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
    }
  }
} catch (error) {
  console.error('Stream error:', error)
}
```

## Event Hooks

All event hooks work with streaming, including tool-related hooks:

```typescript
const client = new Micro({
  model: 'openai:gpt-4o-mini',
  tools: [calculatorTool],
  onComplete: (response, messages) => {
    console.log('Stream completed!')
  },
  onMessage: (messages) => {
    console.log('Message added to history')
  },
  onToolCall: (toolResponse) => {
    console.log('Tool executed:', toolResponse.toolName)
  },
})
```

## Configuration Options

### maxToolInterations

Limits the number of tool call iterations to prevent infinite loops:

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools: [tool1, tool2],
  maxToolInterations: 5, // Default is 10
})
```

If the limit is reached, an error is thrown: `"Max tool call iterations reached"`
