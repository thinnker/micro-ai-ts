export type HttpMethod =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'

export interface HttpClientOptions {
  baseURL: string
  endpoint: string
  headers: Record<string, string>
  body?: Record<string, any>
  timeout?: number
  method?: HttpMethod
  stream?: boolean
}

export interface HttpError extends Error {
  response?: {
    status: number
    data: any
  }
  code?: string
}

const METHODS_WITH_BODY: HttpMethod[] = [
  'POST',
  'post',
  'PUT',
  'put',
  'PATCH',
  'patch',
]

async function request<T = any>(options: HttpClientOptions): Promise<T> {
  const {
    baseURL,
    endpoint,
    headers,
    body,
    timeout,
    method = 'POST',
    stream = false,
  } = options

  const controller = new AbortController()
  const timeoutId = timeout
    ? setTimeout(() => controller.abort(), timeout)
    : undefined

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    }

    if (body && METHODS_WITH_BODY.includes(method)) {
      fetchOptions.body = JSON.stringify(body)
    }

    const response = await fetch(`${baseURL}${endpoint}`, fetchOptions)

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(
        errorData.error?.message || `HTTP error! status: ${response.status}`
      ) as HttpError
      error.response = {
        status: response.status,
        data: errorData,
      }
      error.code = 'HTTP_ERROR'
      throw error
    }

    if (stream) {
      return response as T
    }

    return await response.json()
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout') as HttpError
      timeoutError.code = 'ECONNABORTED'
      throw timeoutError
    }

    throw error
  }
}

export async function httpClient<T = any>(
  options: HttpClientOptions
): Promise<T> {
  return request<T>(options)
}

export async function get<T = any>(
  options: Omit<HttpClientOptions, 'body' | 'method'>
): Promise<T> {
  return request<T>({ ...options, method: 'GET' })
}

export async function post<T = any>(options: HttpClientOptions): Promise<T> {
  return request<T>({ ...options, method: 'POST' })
}

export async function put<T = any>(options: HttpClientOptions): Promise<T> {
  return request<T>({ ...options, method: 'PUT' })
}

export async function patch<T = any>(options: HttpClientOptions): Promise<T> {
  return request<T>({ ...options, method: 'PATCH' })
}

export async function del<T = any>(
  options: Omit<HttpClientOptions, 'body' | 'method'>
): Promise<T> {
  return request<T>({ ...options, method: 'DELETE' })
}

export async function head<T = any>(
  options: Omit<HttpClientOptions, 'body' | 'method'>
): Promise<T> {
  return request<T>({ ...options, method: 'HEAD' })
}

export async function options<T = any>(
  options: Omit<HttpClientOptions, 'body' | 'method'>
): Promise<T> {
  return request<T>({ ...options, method: 'OPTIONS' })
}
