import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { get, post, put, patch, del, head, options } from '../src/http'
import * as http from '../src/http'

describe('http.post', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should make a successful POST request', async () => {
    const mockResponse = { success: true, data: 'test' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await http.post({
      baseURL: 'https://api.example.com',
      endpoint: '/test',
      headers: { 'Content-Type': 'application/json' },
      body: { test: 'data' },
    })

    expect(result).toEqual(mockResponse)
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
      signal: expect.any(AbortSignal),
    })
  })

  it('should handle HTTP errors with error message', async () => {
    const errorData = { error: { message: 'Custom error message' } }
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errorData,
    })

    await expect(
      http.post({
        baseURL: 'https://api.example.com',
        endpoint: '/test',
        headers: {},
        body: {},
      })
    ).rejects.toMatchObject({
      message: 'Custom error message',
      response: {
        status: 400,
        data: errorData,
      },
      code: 'HTTP_ERROR',
    })
  })

  it('should handle HTTP errors without error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    await expect(
      http.post({
        baseURL: 'https://api.example.com',
        endpoint: '/test',
        headers: {},
        body: {},
      })
    ).rejects.toMatchObject({
      message: 'HTTP error! status: 500',
      response: {
        status: 500,
        data: {},
      },
      code: 'HTTP_ERROR',
    })
  })

  it('should handle timeout', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    mockFetch.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(abortError), 100)
        })
    )

    const promise = http.post({
      baseURL: 'https://api.example.com',
      endpoint: '/test',
      headers: {},
      body: {},
      timeout: 100,
    })

    vi.advanceTimersByTime(100)

    await expect(promise).rejects.toMatchObject({
      message: 'Request timeout',
      code: 'ECONNABORTED',
    })
  })

  it('should handle network errors', async () => {
    const networkError = new Error('Network failure')
    mockFetch.mockRejectedValueOnce(networkError)

    await expect(
      http.post({
        baseURL: 'https://api.example.com',
        endpoint: '/test',
        headers: {},
        body: {},
      })
    ).rejects.toThrow('Network failure')
  })

  it('should handle malformed JSON in error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    await expect(
      http.post({
        baseURL: 'https://api.example.com',
        endpoint: '/test',
        headers: {},
        body: {},
      })
    ).rejects.toMatchObject({
      message: 'HTTP error! status: 502',
      response: {
        status: 502,
        data: {},
      },
      code: 'HTTP_ERROR',
    })
  })

  it('should work without timeout', async () => {
    const mockResponse = { data: 'success' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await http.post({
      baseURL: 'https://api.example.com',
      endpoint: '/test',
      headers: {},
      body: {},
    })

    expect(result).toEqual(mockResponse)
  })
})

describe('http.get', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should make a successful GET request', async () => {
    const mockResponse = { success: true, data: 'test' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await http.get({
      baseURL: 'https://api.example.com',
      endpoint: '/test',
      headers: { 'Content-Type': 'application/json' },
    })

    expect(result).toEqual(mockResponse)
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: expect.any(AbortSignal),
    })
  })

  it('should handle GET request errors', async () => {
    const errorData = { error: { message: 'Not found' } }
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => errorData,
    })

    await expect(
      http.get({
        baseURL: 'https://api.example.com',
        endpoint: '/test',
        headers: {},
      })
    ).rejects.toMatchObject({
      message: 'Not found',
      response: {
        status: 404,
        data: errorData,
      },
      code: 'HTTP_ERROR',
    })
  })

  it('should handle GET request timeout', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    mockFetch.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(abortError), 100)
        })
    )

    const promise = http.get({
      baseURL: 'https://api.example.com',
      endpoint: '/test',
      headers: {},
      timeout: 100,
    })

    vi.advanceTimersByTime(100)

    await expect(promise).rejects.toMatchObject({
      message: 'Request timeout',
      code: 'ECONNABORTED',
    })
  })
})

describe('HTTP methods', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('should make POST request', async () => {
    const mockResponse = { success: true }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await post({
      baseURL: 'https://api.example.com',
      endpoint: '/data',
      headers: {},
      body: { test: 'data' },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      })
    )
  })

  it('should make PUT request', async () => {
    const mockResponse = { updated: true }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await put({
      baseURL: 'https://api.example.com',
      endpoint: '/data/1',
      headers: {},
      body: { test: 'updated' },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ test: 'updated' }),
      })
    )
  })

  it('should make PATCH request', async () => {
    const mockResponse = { patched: true }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await patch({
      baseURL: 'https://api.example.com',
      endpoint: '/data/1',
      headers: {},
      body: { field: 'value' },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ field: 'value' }),
      })
    )
  })

  it('should make DELETE request', async () => {
    const mockResponse = { deleted: true }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await del({
      baseURL: 'https://api.example.com',
      endpoint: '/data/1',
      headers: {},
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data/1',
      expect.objectContaining({
        method: 'DELETE',
      })
    )
  })

  it('should make HEAD request', async () => {
    const mockResponse = {}
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await head({
      baseURL: 'https://api.example.com',
      endpoint: '/data',
      headers: {},
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        method: 'HEAD',
      })
    )
  })

  it('should make OPTIONS request', async () => {
    const mockResponse = { methods: ['GET', 'POST'] }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await options({
      baseURL: 'https://api.example.com',
      endpoint: '/data',
      headers: {},
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        method: 'OPTIONS',
      })
    )
  })

  it('should not include body for GET requests', async () => {
    mockFetch.mockClear()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    await get({
      baseURL: 'https://api.example.com',
      endpoint: '/data',
      headers: {},
    })

    const callArgs = mockFetch.mock.calls[0]?.[1]
    expect(callArgs?.body).toBeUndefined()
  })

  it('should not include body for DELETE requests', async () => {
    mockFetch.mockClear()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    await del({
      baseURL: 'https://api.example.com',
      endpoint: '/data/1',
      headers: {},
    })

    const callArgs = mockFetch.mock.calls[0]?.[1]
    expect(callArgs?.body).toBeUndefined()
  })
})
