# Streaming API

The `.stream()` method provides real-time token-by-token streaming of LLM responses.

## Overview

- **Method**: `async stream(prompt: string, bufferString?: string): Promise<StreamResponse>`
- **Automatically sets**: `stream: true`
- **Returns**: AsyncGenerator that yields chunks as they arrive

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

## Examples

See the `examples/stream/` directory for complete examples:

- `simple-stream.ts` - Basic streaming
- `stream-multi-turn.ts` - Multi-turn conversations
- `stream-with-context.ts` - Streaming with system prompts
- `stream-reasoning.ts` - Reasoning model streaming (o1)
- `stream-deepseek-reasoning.ts` - DeepSeek-R1 streaming
- `stream-comparison.ts` - Performance comparison
- `test-stream.ts` - Quick verification test

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

All event hooks work with streaming:

```typescript
const client = new Micro({
  model: 'openai:gpt-4o-mini',
  onComplete: (response, messages) => {
    console.log('Stream completed!')
  },
  onMessage: (messages) => {
    console.log('Message added to history')
  },
})
```
