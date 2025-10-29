export type Provider = {
  apiKey: string
  baseURL: string
  headers?: Record<string, string>
  model: string
}

export type Tool = {
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

export interface Message {
  id?: string
  role: 'system' | 'user' | 'assistant' | 'tool'
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

export type ErrorPayload = {
  type: 'timeout' | 'api_error'
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
}

export type ToolResponse = {
  toolName: string
  arguments: any
  result: any
  error?: any
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

export interface MicroOptions {
  model?: string
  provider?: Provider
  systemPrompt?: string
  prompt?: string
  messages?: Message[]
  context?: Record<string, any>
  maxTokens?: number
  temperature?: number
  tools?: Tool[]
  tool_choice?: ToolChoice
  streaming?: boolean
  reasoning?: boolean
  reasoning_effort?: ReasoningLevel
  timeout?: number
  debug?: boolean
  onComplete?: OnCompleteResponse
  onMessage?: OnMessageResponse
  onRequest?: OnRequestData
  onResponseData?: OnResponseData
  onError?: OnErrorResponse
  onToolCall?: OnToolCall
}
