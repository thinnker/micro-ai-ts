export type Provider = {
  apiKey: string
  baseURL: string
  model: string
  headers?: Record<string, string>
}

export type ToolSchema = {
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

export type Tool = {
  schema: ToolSchema
  execute: (args: any) => any
}

export type ContentPart =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'image_url'
      image_url: {
        url: string
      }
    }

export type ContentOptions = string | null | ContentPart[]

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface Message {
  id?: string
  role: MessageRole
  content: ContentOptions
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type ToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'function'; function: { name: string } }

export type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high'

export type ReasoningOptions = {
  enabled?: boolean
  effort?: ReasoningLevel
}

export type TokenUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

export type Metadata = {
  id: string
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
  isReasoningEnabled?: boolean | ReasoningLevel
  isReasoningModel?: boolean
  reasoning_effort?: ReasoningLevel
  hasThoughts?: boolean
}

export type ErrorPayloadType = 'timeout' | 'api_error'

export type ErrorPayload = {
  type: ErrorPayloadType
  message: string
  status?: number
  code?: string
  details?: any
}

export type Response = {
  metadata: Metadata
  completion: {
    role: string
    content: string
    reasoning?: string
    original: string
  }
  error?: ErrorPayload
  fullResponse?: Record<string, unknown>
}

export type StreamChunk = {
  delta: string
  fullContent: string
  reasoning?: string
  done: boolean
  metadata?: Metadata
  completion?: {
    role: string
    content: string
    reasoning?: string
    original: string
  }
}

export type StreamResponse = AsyncGenerator<StreamChunk, void, unknown>

export type ToolResponse = {
  toolName: string
  arguments: string
  result: string | null
  error?: string
}

export type OnCompleteResponse = (
  result: Response,
  messages?: Message[]
) => void

export type OnMessageResponse = (messages: Message[]) => void

export type OnRequestData = (request: any) => void

export type OnResponseData = (response: any) => void

export type OnErrorResponse = (error: any) => void

export type OnToolCall = (toolResponse: ToolResponse) => void

export type LlmParams = {
  model?: string
  messages?: Message[]
  tool_choice?: ToolChoice
  temperature?: number
  max_tokens?: number
  max_completion_tokens?: number
  stream?: boolean
  top_p?: number
  top_k?: number
  presence_penalty?: number
  frequency_penalty?: number
}

export type MicroOptions = {
  provider?: Provider
  systemPrompt?: string
  prompt?: string
  context?: Record<string, any>
  maxTokens?: number
  tools?: Tool[]
  reasoning?: boolean
  reasoning_effort?: ReasoningLevel
  timeout?: number
  debug?: boolean
  override?: LlmParams & Record<string, any>
  onComplete?: OnCompleteResponse
  onMessage?: OnMessageResponse
  onRequest?: OnRequestData
  onResponseData?: OnResponseData
  onError?: OnErrorResponse
  onToolCall?: OnToolCall
} & LlmParams
