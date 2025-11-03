import 'dotenv/config'
import type {
  MicroOptions,
  Message,
  Provider,
  ReasoningLevel,
  Metadata,
  Response,
  StreamResponse,
  MessageRole,
} from './types'
import { Providers } from './providers'
import { httpClient } from './http'
import {
  randomId,
  parseTemplate,
  stripModelName,
  stripProviderName,
  isBufferString,
  hasTag,
  stripTag,
  extractInnerTag,
  takeRight,
  sanitizeProvider,
} from './utils/utils'

const Defaults = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  providerName: 'openai',
  model: 'gpt-4.1-mini',
  temperature: 0,
  defaultEndpointCompletionSuffix: '/chat/completions',
}

export class Micro {
  private baseURL: string
  private headers: Record<string, string>
  private model: string
  private systemPrompt: string
  private messages: Message[]
  private context: Record<string, any>
  private prompt: string
  private maxTokens?: number
  private temperature?: number
  private tools?: MicroOptions['tools']
  private tool_choice?: MicroOptions['tool_choice']
  private streamEnabled: boolean
  private parsedSystemPrompt: string
  private defaultProvider: Omit<Provider, 'model'>
  private modelName: string
  private providerName: string
  private identifier: string
  private timeout?: number
  private reasoning_effort?: ReasoningLevel

  private onComplete?: MicroOptions['onComplete']
  private onMessage?: MicroOptions['onMessage']
  private onRequest?: MicroOptions['onRequest']
  private onResponseData?: MicroOptions['onResponseData']
  private onError?: MicroOptions['onError']
  private onToolCall?: MicroOptions['onToolCall']

  private debug: boolean

  private reasoning: boolean
  private isReasoningModel: boolean
  private isGemini25Reasoning: boolean
  private isOpenAIReasoning: boolean
  private isOpenAI5: boolean
  private isGLMReasoning: boolean
  private isQWQ: boolean
  private isDeepseekReasoning: boolean
  private isQwen3: boolean
  private isMinimaxM2: boolean

  constructor(options: MicroOptions = {}) {
    this.identifier = randomId()
    this.timeout = options?.timeout

    this.modelName = stripModelName(options?.model || '') || Defaults.model
    this.providerName =
      stripProviderName(options?.model || '') || Defaults.providerName

    let providerConfig: Provider | undefined
    if (this.providerName) {
      const providerFn = Providers[this.providerName as keyof typeof Providers]
      if (providerFn) {
        providerConfig = providerFn(this.modelName)
      }
    }

    this.defaultProvider = {
      baseURL:
        providerConfig?.baseURL ??
        options?.provider?.baseURL ??
        Defaults.baseURL,
      apiKey:
        providerConfig?.apiKey ?? options?.provider?.apiKey ?? Defaults.apiKey,
      ...(options?.provider?.headers && {
        headers: options.provider.headers,
      }),
    }

    if (!this.defaultProvider.apiKey) {
      throw new Error('API Key is required')
    }

    this.baseURL = this.defaultProvider.baseURL
    this.headers = {
      Authorization: `Bearer ${this.defaultProvider.apiKey}`,
      'Content-Type': 'application/json',
      ...this.defaultProvider.headers,
    }

    this.model = this.modelName
    this.systemPrompt = options?.systemPrompt || ''
    this.prompt = options?.prompt || ''

    this.context = options.context ?? {}
    this.parsedSystemPrompt = this.systemPrompt
      ? parseTemplate(this.systemPrompt, this.context)
      : ''
    this.maxTokens = options.maxTokens
    this.temperature =
      options.temperature !== undefined
        ? options.temperature
        : Defaults.temperature
    this.tools = options.tools
    this.tool_choice = options.tool_choice

    this.debug = options?.debug || false
    this.streamEnabled = options?.stream || false

    this.isOpenAI5 = this.model?.toLowerCase()?.includes('gpt-5')
    this.isOpenAIReasoning =
      this.model?.toLowerCase()?.includes('o1') ||
      this.model?.toLowerCase()?.includes('o3') ||
      this.model?.toLowerCase()?.includes('o4') ||
      this.isOpenAI5

    this.isGemini25Reasoning = this.model?.toLowerCase()?.includes('gemini-2.5')

    this.isGLMReasoning = this.model?.toLowerCase()?.includes('glm-4.')
    this.isQWQ = this.model?.toLowerCase()?.includes('qwq')
    this.isDeepseekReasoning =
      this.model?.toLowerCase()?.includes('deepseek-reasoner') ||
      this.model?.toLowerCase()?.includes('deepseek-r1')
    this.isQwen3 = this.model?.toLowerCase()?.includes('qwen3')
    this.isMinimaxM2 = this.model?.toLowerCase()?.includes('-m2')

    this.isReasoningModel =
      this.isGemini25Reasoning ||
      this.isOpenAIReasoning ||
      this.isGLMReasoning ||
      this.isQWQ ||
      this.isDeepseekReasoning ||
      this.isQwen3 ||
      this.isMinimaxM2

    this.reasoning = options?.reasoning || !!this.isReasoningModel
    this.reasoning_effort = options.reasoning_effort ?? 'medium'

    this.onComplete = options.onComplete || undefined
    this.onMessage = options.onMessage || undefined
    this.onRequest = options.onRequest || undefined
    this.onResponseData = options.onResponseData || undefined
    this.onError = options.onError || undefined
    this.onToolCall = options.onToolCall || undefined

    this.messages = options?.messages ?? []
    this.setSystemPrompt(this.parsedSystemPrompt)

    if (this.debug) {
      console.log('\n=============================================')
      console.log('Micro INFO:')
      console.log('=============================================')
      console.log('IDENTIFIER:      ', this.identifier)
      console.log('MODEL NAME:      ', this.modelName)
      console.log('PROVIDER NAME:   ', this.providerName)
      console.log('DEFAULT PROVIDER ', sanitizeProvider(this.defaultProvider))
      console.log('=============================================\n')
    }
  }

  public getMetadata(): Metadata {
    return {
      id: this.identifier,
      prompt: this.prompt,
      providerName: this.providerName,
      model: this.modelName,
      timing: {
        latencyMs: 0,
        latencySeconds: 0,
      },
      timestamp: new Date().toISOString(),
      context: this.context,
      ...(this.isReasoningModel && {
        isReasoningEnabled: this.reasoning,
        isReasoningModel: this.isReasoningModel,
        reasoning_effort: this.reasoning_effort,
      }),
    }
  }

  public getSystemPrompt(): string {
    return this.parsedSystemPrompt
  }

  public setSystemPrompt(prompt: string): void {
    if (!prompt) return
    this.parsedSystemPrompt = parseTemplate(prompt, this.context)
    if (this.parsedSystemPrompt && !this.getSystemMessage().length) {
      this.messages.unshift({
        role: 'system',
        content: this.parsedSystemPrompt,
      })
    }
  }

  private getSystemMessage(): Message[] {
    return this.messages.filter((msg) => msg.role === 'system')
  }

  private getNonSystemMessages(): Message[] {
    return this.messages.filter((msg) => msg.role !== 'system')
  }

  public flushAllMessages(): void {
    this.messages = []
  }

  public limitMessages(limit: number = 5): Message[] {
    const systemPromptMessage = this.getSystemMessage()
    const restOfMessages = this.getNonSystemMessages()
    const limitMessages = takeRight(restOfMessages, limit)
    const limitedHistory = [...systemPromptMessage, ...limitMessages]
    this.messages = limitedHistory
    return this.messages
  }

  public getMessages(): Message[] {
    return this.messages
  }

  public setMessages(messages: Message[]): void {
    this.messages = messages
  }

  public setUserMessage(prompt: string, bufferString?: string): void {
    const parsedPrompt = parseTemplate(prompt, this.context)
    this.prompt = parsedPrompt

    if (bufferString && isBufferString(bufferString)) {
      this.messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: parsedPrompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: bufferString,
            },
          },
        ],
      })
    } else {
      this.messages.push({
        role: 'user',
        content: parsedPrompt,
      })
    }

    if (this.onMessage) {
      this.onMessage(this.messages)
    }
  }

  public setAssistantMessage(prompt: string): this {
    const parsedPrompt = parseTemplate(prompt, this.context)

    this.messages.push({
      role: 'assistant',
      content: parsedPrompt,
    })

    if (this.onMessage) {
      this.onMessage(this.messages)
    }

    return this
  }

  private async makeRequest(
    enableStream: boolean = false
  ): Promise<Record<string, any> | Response> {
    const requestBody: any = {
      model: this.model,
      messages: this.messages,
      stream: enableStream || this.streamEnabled,
    }

    if (this.temperature) {
      requestBody.temperature = this.temperature
    }

    if (this.maxTokens) {
      requestBody.max_tokens = this.maxTokens
    }

    if (this.tools && this.tools.length > 0) {
      requestBody.tools = this.tools.map((tool) => tool.schema)
      if (this.tool_choice) {
        requestBody.tool_choice = this.tool_choice
      }
    }

    if (this.reasoning && this.isReasoningModel) {
      if (this.isOpenAIReasoning) {
        requestBody.reasoning_effort = this.reasoning_effort
        if (this.maxTokens) {
          requestBody.max_completion_tokens = this.maxTokens
          delete requestBody.max_tokens
        }
      } else if (this.isGemini25Reasoning) {
        const thinkingBudgetMap: Record<ReasoningLevel, number> = {
          minimal: 2048,
          low: 4096,
          medium: 8192,
          high: 16384,
        }
        requestBody.extra_body = {
          google: {
            thinking_config: {
              thinking_budget:
                thinkingBudgetMap[this.reasoning_effort || 'medium'],
              include_thoughts: true,
            },
          },
        }
      } else if (this.isGLMReasoning) {
        requestBody.thinking = {
          type: 'enabled',
        }
      }
    }

    if (this.onRequest) {
      this.onRequest(requestBody)
    }

    const data = await httpClient({
      baseURL: this.baseURL,
      endpoint: Defaults.defaultEndpointCompletionSuffix,
      headers: this.headers,
      body: requestBody,
      timeout: this.timeout,
      method: 'POST',
      stream: enableStream || this.streamEnabled,
    })

    if (this.onResponseData && !enableStream) {
      this.onResponseData(data)
    }

    return data
  }

  private async executeTool(
    toolName: string,
    toolArguments: string
  ): Promise<any> {
    const tool = this.tools?.find((t) => t.schema.function.name === toolName)

    if (!tool) {
      const errorMessage = `Tool "${toolName}" not found`
      if (this.onToolCall) {
        this.onToolCall({
          toolName,
          arguments: toolArguments,
          result: null,
          error: errorMessage,
        })
      }
      return errorMessage
    }

    try {
      const parsedArgs = JSON.parse(toolArguments)
      const result = await tool.execute(parsedArgs)

      if (this.onToolCall) {
        this.onToolCall({
          toolName,
          arguments: parsedArgs,
          result,
        })
      }

      return result
    } catch (error: any) {
      const errorMessage = `Error executing tool "${toolName}": ${error.message}`
      if (this.onToolCall) {
        this.onToolCall({
          toolName,
          arguments: toolArguments,
          result: null,
          error: errorMessage,
        })
      }
      return errorMessage
    }
  }

  private async handleToolCalls(toolCalls: any[]): Promise<void> {
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name
      const toolArguments = toolCall.function.arguments

      const result = await this.executeTool(toolName, toolArguments)

      this.messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolName,
        content: typeof result === 'string' ? result : JSON.stringify(result),
      })

      if (this.onMessage) {
        this.onMessage(this.messages)
      }
    }
  }

  public async invoke(): Promise<Response> {
    const startTime = Date.now()

    try {
      const responseData = (await this.makeRequest()) as Record<string, any>

      const choice = responseData.choices?.[0]
      const message = choice?.message

      if (message) {
        this.messages.push(message)

        if (this.onMessage) {
          this.onMessage(this.messages)
        }
      }

      if (message?.tool_calls && message.tool_calls.length > 0) {
        await this.handleToolCalls(message.tool_calls)
        return this.invoke()
      }

      const endTime = Date.now()
      const latencyMs = endTime - startTime

      let reasoning = ''
      let content = message?.content || ''

      // Reasoning detection
      if (message?.reasoning) {
        reasoning = message?.reasoning
      }

      if (message?.reasoning_content) {
        reasoning = message?.reasoning_content
      }

      if (hasTag(content, 'thinking')) {
        reasoning = extractInnerTag(content, 'thinking')
        content = stripTag(content, 'thinking')
      }

      if (hasTag(content, 'thought')) {
        reasoning = extractInnerTag(content, 'thought')
        content = stripTag(content, 'thought')
      }

      const response: Response = {
        metadata: {
          id: this.identifier,
          prompt: this.prompt,
          providerName: this.providerName,
          model: this.modelName,
          tokensUsed: responseData.usage,
          timing: {
            latencyMs,
            latencySeconds: latencyMs / 1000,
          },
          timestamp: new Date().toISOString(),
          context: this.context,
          isReasoningEnabled: this.reasoning,
          isReasoningModel: this.isReasoningModel || reasoning?.length > 0,
          reasoning_effort: this.reasoning_effort,
          hasThoughts: reasoning?.length > 0,
        },
        fullResponse: responseData,
        completion: {
          role: message?.role || 'assistant',
          content: content.trim(),
          reasoning: reasoning.trim(),
          original: message?.content || '',
        },
      }

      if (this.onComplete) {
        this.onComplete(response, this.messages)
      }

      return response
    } catch (error: any) {
      const endTime = Date.now()
      const latencyMs = endTime - startTime

      const errorResponse: Response = {
        metadata: {
          id: this.identifier,
          prompt: this.prompt,
          providerName: this.providerName,
          model: this.modelName,
          timing: {
            latencyMs,
            latencySeconds: latencyMs / 1000,
          },
          timestamp: new Date().toISOString(),
          context: this.context,
        },
        completion: {
          role: 'assistant',
          content: '',
          original: '',
        },
        error: {
          type: error.code === 'ECONNABORTED' ? 'timeout' : 'api_error',
          message: error.message,
          status: error.response?.status,
          code: error.code,
          details: error.response?.data,
        },
      }

      if (this.onError) {
        this.onError(errorResponse.error)
      }

      return Promise.reject(errorResponse.error)
    }
  }

  public async chat(prompt: string, bufferString?: string): Promise<Response> {
    this.setUserMessage(prompt, bufferString)
    return this.invoke()
  }

  private async *processStream(
    response: Response,
    startTime: number
  ): StreamResponse {
    const reader = (response as any).body?.getReader()
    if (!reader) {
      throw new Error('Stream not available')
    }

    const decoder = new TextDecoder()
    let fullContent = ''
    let reasoning = ''
    let role = 'assistant'
    let buffer = ''
    let tokensUsed: any = undefined

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || trimmedLine === 'data: [DONE]') {
            continue
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6)
              const parsed = JSON.parse(jsonStr)
              const delta = parsed.choices?.[0]?.delta

              if (delta?.role) {
                role = delta.role
              }

              // Yield if there's either content or reasoning
              if (delta.content || delta.reasoning || delta.reasoning_content) {
                fullContent += delta.content
                reasoning += delta.reasoning || delta.reasoning_content

                yield {
                  delta: delta.content,
                  reasoning: delta.reasoning || delta.reasoning_content,
                  fullContent,
                  done: false,
                }
              }

              // Capture token usage when available (usually in the final chunk)
              if (parsed.usage) {
                tokensUsed = parsed.usage || {}
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add assistant message to history
      this.messages.push({
        role: role as MessageRole,
        content: fullContent,
      })

      if (this.onMessage) {
        this.onMessage(this.messages)
      }

      const endTime = Date.now()
      const latencyMs = endTime - startTime

      const metadata: Metadata = {
        id: this.identifier,
        prompt: this.prompt,
        providerName: this.providerName,
        model: this.modelName,
        tokensUsed,
        timing: {
          latencyMs,
          latencySeconds: latencyMs / 1000,
        },
        timestamp: new Date().toISOString(),
        context: this.context,
        isReasoningEnabled: this.reasoning,
        isReasoningModel: this.isReasoningModel,
        reasoning_effort: this.reasoning_effort,
        hasThoughts: reasoning.length > 0,
      }

      const completion = {
        role,
        content: fullContent.trim(),
        reasoning: reasoning.trim(),
        original: fullContent,
      }

      const finalResponse: Response = {
        metadata,
        completion,
      }

      if (this.onComplete) {
        this.onComplete(finalResponse, this.messages)
      }

      // Yield final chunk with metadata and completion
      yield {
        delta: '',
        fullContent: fullContent.trim(),
        reasoning: reasoning.trim(),
        done: true,
        metadata,
        completion,
      }
    } catch (error: any) {
      const endTime = Date.now()
      const latencyMs = endTime - startTime

      const errorResponse: Response = {
        metadata: {
          id: this.identifier,
          prompt: this.prompt,
          providerName: this.providerName,
          model: this.modelName,
          timing: {
            latencyMs,
            latencySeconds: latencyMs / 1000,
          },
          timestamp: new Date().toISOString(),
          context: this.context,
        },
        completion: {
          role: 'assistant',
          content: '',
          original: '',
        },
        error: {
          type: 'api_error',
          message: error.message,
        },
      }

      if (this.onError) {
        this.onError(errorResponse.error)
      }

      throw errorResponse.error
    }
  }

  public async stream(
    prompt: string,
    bufferString?: string
  ): Promise<StreamResponse> {
    this.setUserMessage(prompt, bufferString)

    const startTime = Date.now()

    try {
      const response = await this.makeRequest(true)
      return this.processStream(response as Response, startTime)
    } catch (error: any) {
      const endTime = Date.now()
      const latencyMs = endTime - startTime

      const errorResponse: Response = {
        metadata: {
          id: this.identifier,
          prompt: this.prompt,
          providerName: this.providerName,
          model: this.modelName,
          timing: {
            latencyMs,
            latencySeconds: latencyMs / 1000,
          },
          timestamp: new Date().toISOString(),
          context: this.context,
        },
        completion: {
          role: 'assistant',
          content: '',
          original: '',
        },
        error: {
          type: error.code === 'ECONNABORTED' ? 'timeout' : 'api_error',
          message: error.message,
          status: error.response?.status,
          code: error.code,
          details: error.response?.data,
        },
      }

      if (this.onError) {
        this.onError(errorResponse.error)
      }

      throw errorResponse.error
    }
  }
}
