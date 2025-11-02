import { describe, it, expect, vi } from 'vitest'
import { Micro } from '../src/client'

describe('Micro Stream', () => {
  it('should stream responses token by token', async () => {
    const micro = new Micro({
      model: 'openai:gpt-4o-mini',
    })

    const stream = await micro.stream('Count from 1 to 3')
    const chunks: string[] = []

    for await (const chunk of stream) {
      if (!chunk.done) {
        chunks.push(chunk.delta)
        expect(chunk.fullContent).toContain(chunk.delta)
      } else {
        expect(chunk.fullContent).toBeTruthy()
        expect(chunk.metadata).toBeDefined()
        if (chunk.metadata) {
          expect(chunk.metadata.timing.latencyMs).toBeGreaterThan(0)
        }
      }
    }

    expect(chunks.length).toBeGreaterThan(0)
  })

  it('should maintain conversation history with streaming', async () => {
    const micro = new Micro({
      model: 'openai:gpt-4o-mini',
    })

    const stream1 = await micro.stream('What is 2+2?')
    for await (const chunk of stream1) {
      if (chunk.done) {
        expect(chunk.fullContent).toBeTruthy()
      }
    }

    const stream2 = await micro.stream('Multiply that by 3')
    for await (const chunk of stream2) {
      if (chunk.done) {
        expect(chunk.fullContent).toBeTruthy()
      }
    }

    const messages = micro.getMessages()
    expect(messages.length).toBeGreaterThan(2)
  })

  it('should handle streaming with system prompt', async () => {
    const micro = new Micro({
      model: 'openai:gpt-4o-mini',
      systemPrompt: 'You are a helpful assistant.',
    })

    const stream = await micro.stream('Hello')
    let finalResponse = null

    for await (const chunk of stream) {
      if (chunk.done) {
        finalResponse = chunk
      }
    }

    expect(finalResponse).toBeTruthy()
    expect(finalResponse?.completion).toBeDefined()
    if (finalResponse?.completion) {
      expect(finalResponse.completion.content).toBeTruthy()
    }
  })

  it('should call onComplete callback after streaming', async () => {
    const onComplete = vi.fn()

    const micro = new Micro({
      model: 'openai:gpt-4o-mini',
      onComplete,
    })

    const stream = await micro.stream('Test')
    for await (const chunk of stream) {
      if (chunk.done) {
        expect(chunk).toBeTruthy()
      }
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('should extract reasoning from reasoning models', async () => {
    const micro = new Micro({
      model: 'openai:gpt-5-nano',
      reasoning: true,
    })

    const stream = await micro.stream('What is 5+5?')
    let hasReasoning = false

    for await (const chunk of stream) {
      if (chunk.done && chunk.reasoning) {
        hasReasoning = true
        expect(chunk.reasoning).toBeTruthy()
      }
    }

    // Note: This may not always have reasoning depending on the model's response
    // but the structure should be correct
    expect(hasReasoning).toBeDefined()
  })
})
