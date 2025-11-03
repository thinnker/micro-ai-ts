import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Micro } from '../src/client'
import { httpClient } from '../src/http'

vi.mock('../src/http')

describe('Micro Stream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should stream responses token by token', async () => {
    const mockStreamData = [
      { choices: [{ delta: { role: 'assistant', content: '1' } }] },
      { choices: [{ delta: { content: ', ' } }] },
      { choices: [{ delta: { content: '2' } }] },
      { choices: [{ delta: { content: ', ' } }] },
      { choices: [{ delta: { content: '3' } }] },
      { usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } },
    ]

    const mockStream = createMockStream(mockStreamData)
    vi.mocked(httpClient).mockResolvedValue({ body: mockStream } as any)

    const micro = new Micro({
      model: 'openrouter:openai/gpt-oss-20b',
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
          expect(chunk.metadata.timing.latencyMs).toBeGreaterThanOrEqual(0)
        }
      }
    }

    expect(chunks.length).toBeGreaterThan(0)
  })

  it('should maintain conversation history with streaming', async () => {
    const mockStreamData1 = [
      { choices: [{ delta: { role: 'assistant', content: '2+2' } }] },
      { choices: [{ delta: { content: ' equals ' } }] },
      { choices: [{ delta: { content: '4' } }] },
      { usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } },
    ]

    const mockStreamData2 = [
      { choices: [{ delta: { role: 'assistant', content: '4' } }] },
      { choices: [{ delta: { content: ' * 3' } }] },
      { choices: [{ delta: { content: ' = 12' } }] },
      { usage: { prompt_tokens: 15, completion_tokens: 7, total_tokens: 22 } },
    ]

    vi.mocked(httpClient)
      .mockResolvedValueOnce({ body: createMockStream(mockStreamData1) } as any)
      .mockResolvedValueOnce({ body: createMockStream(mockStreamData2) } as any)

    const micro = new Micro({
      model: 'openrouter:openai/gpt-oss-20b',
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
    const mockStreamData = [
      { choices: [{ delta: { role: 'assistant', content: 'Hello!' } }] },
      { choices: [{ delta: { content: ' How can' } }] },
      { choices: [{ delta: { content: ' I help you?' } }] },
      { usage: { prompt_tokens: 20, completion_tokens: 8, total_tokens: 28 } },
    ]

    vi.mocked(httpClient).mockResolvedValue({
      body: createMockStream(mockStreamData),
    } as any)

    const micro = new Micro({
      model: 'openrouter:openai/gpt-oss-20b',
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
    const mockStreamData = [
      { choices: [{ delta: { role: 'assistant', content: 'Test' } }] },
      { choices: [{ delta: { content: ' response' } }] },
      { usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 } },
    ]

    vi.mocked(httpClient).mockResolvedValue({
      body: createMockStream(mockStreamData),
    } as any)

    const onComplete = vi.fn()

    const micro = new Micro({
      model: 'openrouter:openai/gpt-oss-20b',
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
    const mockStreamData = [
      {
        choices: [
          {
            delta: {
              role: 'assistant',
              reasoning_content: 'Let me calculate: 5 + 5',
            },
          },
        ],
      },
      { choices: [{ delta: { content: 'The answer' } }] },
      { choices: [{ delta: { content: ' is 10' } }] },
      { usage: { prompt_tokens: 10, completion_tokens: 6, total_tokens: 16 } },
    ]

    vi.mocked(httpClient).mockResolvedValue({
      body: createMockStream(mockStreamData),
    } as any)

    const micro = new Micro({
      model: 'openrouter:openai/gpt-oss-20b',
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

    expect(hasReasoning).toBe(true)
  })
})

// Helper function to create a mock readable stream
function createMockStream(data: any[]) {
  const encoder = new (globalThis as any).TextEncoder()
  let index = 0

  return {
    getReader() {
      return {
        async read() {
          if (index >= data.length) {
            return { done: true, value: undefined }
          }

          const chunk = data[index++]
          const line = `data: ${JSON.stringify(chunk)}\n\n`
          const value = encoder.encode(line)

          return { done: false, value }
        },
      }
    },
  }
}
