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
  ModelCapabilities,
  LlmParams,
  ToolCall,
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
  defaultEndpointCompletionSuffix: '/chat/completions',
}

export class Micro {
  private readonly identifier: string
  private readonly baseURL: string
  private readonly headers: Record<string, string>
  private readonly model: string
  private readonly modelName: string
  private readonly providerName: string
  private readonly defaultProvider: Omit<Provider, 'model'>
  private readonly capabilities: ModelCapabilities
  private readonly debug: boolean
  private readonly streamEnabled: boolean
  private readonly timeout?: number

  private systemPrompt: string
  private parsedSystemPrompt: string
  private messages: Message[]
  private context: Record<string, any>
  private prompt: string
  private maxTokens?: number
  private temperature?: number
  private tools?: MicroOptions['tools']
  private tool_choice?: MicroOptions['tool_choice']
  private reasoning: boolean
  private reasoning_effort?: ReasoningLevel
  private override?: LlmParams & Record<string, any>
  private maxToolInterations: number

  private onComplete?: MicroOptions['onComplete']
  private onMessage?: MicroOptions['onMessage']
  private onRequest?: MicroOptions['onRequest']
  private onResponseData?: MicroOptions['onResponseData']
  private onError?: MicroOptions['onError']
  private onToolCall?: MicroOptions['onToolCall']

  constructor(options: MicroOptions = {}) {
    this.identifier = randomId()
    this.timeout = options.timeout ?? 120000
    this.debug = options.debug ?? false
    this.maxToolInterations = options.maxToolInterations ?? 10
    this.streamEnabled = options.stream ?? false

    this.modelName = stripModelName(options.model || '') || Defaults.model
    this.providerName =
      stripProviderName(options.model || '') || Defaults.providerName
    this.model = this.modelName

    this.defaultProvider = this.initializeProvider(options)
    this.baseURL = this.defaultProvider.baseURL
    this.headers = this.buildHeaders()

    this.capabilities = this.detectModelCapabilities()
    this.reasoning = options.reasoning ?? this.capabilities.isReasoningModel
    this.reasoning_effort = this.reasoning
      ? (options.reasoning_effort ?? 'medium')
      : undefined

    this.systemPrompt = options.systemPrompt || ''
    this.prompt = options.prompt || ''
    this.context = options.context ?? {}
    this.parsedSystemPrompt = this.systemPrompt
      ? parseTemplate(this.systemPrompt, this.context)
      : ''

    this.maxTokens = options.maxTokens
    this.temperature = options.temperature
    this.tools = options.tools
    this.tool_choice = options.tool_choice

    this.override = options.override

    this.onComplete = options.onComplete
    this.onMessage = options.onMessage
    this.onRequest = options.onRequest
    this.onResponseData = options.onResponseData
    this.onError = options.onError
    this.onToolCall = options.onToolCall

    this.messages = options.messages ?? []
    this.setSystemPrompt(this.parsedSystemPrompt)

    if (this.debug) this.logDebugInfo()
  }

  private initializeProvider(options: MicroOptions): Omit<Provider, 'model'> {
    const providerFn = Providers[this.providerName as keyof typeof Providers]
    const providerConfig = providerFn?.(this.modelName)

    const provider = {
      baseURL:
        providerConfig?.baseURL ??
        options.provider?.baseURL ??
        Defaults.baseURL,
      apiKey:
        providerConfig?.apiKey ?? options.provider?.apiKey ?? Defaults.apiKey,
      ...(options.provider?.headers && { headers: options.provider.headers }),
    }

    if (!provider.apiKey) {
      throw new Error('API Key is required')
    }

    return provider
  }

  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.defaultProvider.apiKey}`,
      'Content-Type': 'application/json',
      ...this.defaultProvider.headers,
    }
  }

  private detectModelCapabilities(): ModelCapabilities {
    const modelLower = this.model.toLowerCase()

    const isOpenAI5 = modelLower.includes('gpt-5')
    const isOpenAIReasoning =
      ['o1', 'o3', 'o4'].some((v) => modelLower.includes(v)) || isOpenAI5
    const isGemini25Reasoning = modelLower.includes('gemini-2.5')
    const isGLMReasoning = modelLower.includes('glm-4.')
    const isQWQ = modelLower.includes('qwq')
    const isDeepseekReasoning =
      modelLower.includes('deepseek-reasoner') ||
      modelLower.includes('deepseek-r1')
    const isQwen3 = modelLower.includes('qwen3')
    const isMinimaxM2 = modelLower.includes('-m2')

    const isReasoningModel =
      isGemini25Reasoning ||
      isOpenAIReasoning ||
      isGLMReasoning ||
      isQWQ ||
      isDeepseekReasoning ||
      isQwen3 ||
      isMinimaxM2

    return {
      isOpenAI5,
      isOpenAIReasoning,
      isGemini25Reasoning,
      isGLMReasoning,
      isQWQ,
      isDeepseekReasoning,
      isQwen3,
      isMinimaxM2,
      isReasoningModel,
    }
  }

  private logDebugInfo(): void {
    console.log('\n=============================================')
    console.log('Micro INFO:')
    console.log('=============================================')
    console.log('IDENTIFIER:      ', this.identifier)
    console.log('MODEL NAME:      ', this.modelName)
    console.log('PROVIDER NAME:   ', this.providerName)
    console.log('DEFAULT PROVIDER ', sanitizeProvider(this.defaultProvider))
    console.log('=============================================\n')
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
      ...(this.capabilities.isReasoningModel && {
        isReasoningEnabled: this.reasoning,
        isReasoningModel: this.capabilities.isReasoningModel,
        ...(this.reasoning_effort && {
          reasoning_effort: this.reasoning_effort,
        }),
      }),
    }
  }

  public getSystemPrompt(): string {
    return this.parsedSystemPrompt
  }

  public setSystemPrompt(prompt: string): void {
    if (!prompt) return
    this.parsedSystemPrompt = parseTemplate(prompt, this.context)

    const hasSystemMessage = this.messages.some((msg) => msg.role === 'system')
    if (this.parsedSystemPrompt && !hasSystemMessage) {
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
    const systemMessages = this.getSystemMessage()
    const otherMessages = this.getNonSystemMessages()
    const limitedMessages = takeRight(otherMessages, limit)

    this.messages = [...systemMessages, ...limitedMessages]
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

    const content =
      bufferString && isBufferString(bufferString)
        ? [
            { type: 'text' as const, text: parsedPrompt },
            { type: 'image_url' as const, image_url: { url: bufferString } },
          ]
        : parsedPrompt

    this.messages.push({ role: 'user', content })
    this.onMessage?.(this.messages)
  }

  public setAssistantMessage(prompt: string): this {
    const parsedPrompt = parseTemplate(prompt, this.context)
    this.messages.push({ role: 'assistant', content: parsedPrompt })
    this.onMessage?.(this.messages)
    return this
  }

  private buildRequestBody(enableStream: boolean): Record<string, any> {
    let body: Record<string, any> = {
      model: this.model,
      messages: this.messages,
      stream: enableStream || this.streamEnabled,
    }

    if (this.temperature !== undefined) body.temperature = this.temperature
    if (this.maxTokens) body.max_tokens = this.maxTokens

    if (this.tools?.length) {
      body.tools = this.tools.map((tool) => tool.schema)
      if (this.tool_choice) body.tool_choice = this.tool_choice
    }

    if (this.reasoning && this.capabilities.isReasoningModel) {
      this.applyReasoningConfig(body)
    }
    if (this.override) {
      body = { ...body, ...this.override }
    }

    return body
  }

  private applyReasoningConfig(body: Record<string, any>): void {
    if (this.capabilities.isOpenAIReasoning) {
      body.reasoning_effort = this.reasoning_effort
      if (this.maxTokens) {
        body.max_completion_tokens = this.maxTokens
        delete body.max_tokens
      }
    } else if (this.capabilities.isGemini25Reasoning) {
      const thinkingBudgetMap: Record<ReasoningLevel, number> = {
        minimal: 2048,
        low: 4096,
        medium: 8192,
        high: 16384,
      }
      body.extra_body = {
        google: {
          thinking_config: {
            thinking_budget:
              thinkingBudgetMap[this.reasoning_effort || 'medium'],
            include_thoughts: true,
          },
        },
      }
    } else if (this.capabilities.isGLMReasoning) {
      body.thinking = { type: 'enabled' }
    }
  }

  private async makeRequest(
    enableStream: boolean = false
  ): Promise<Record<string, any> | Response> {
    const requestBody = this.buildRequestBody(enableStream)
    this.onRequest?.(requestBody)

    const data = await httpClient({
      baseURL: this.baseURL,
      endpoint: Defaults.defaultEndpointCompletionSuffix,
      headers: this.headers,
      body: requestBody,
      timeout: this.timeout,
      method: 'POST',
      stream: enableStream || this.streamEnabled,
    })

    if (!enableStream) this.onResponseData?.(data)
    return data
  }

  private async executeTool(
    toolName: string,
    toolArguments: string
  ): Promise<any> {
    const tool = this.tools?.find((t) => t.schema.function.name === toolName)

    if (!tool) {
      const errorMessage = `Tool "${toolName}" not found`
      this.onToolCall?.({
        toolName,
        arguments: toolArguments,
        result: null,
        error: errorMessage,
      })
      return errorMessage
    }

    try {
      const parsedArgs = JSON.parse(toolArguments)
      const result = await tool.execute(parsedArgs)
      this.onToolCall?.({ toolName, arguments: parsedArgs, result })
      return result
    } catch (error: any) {
      const errorMessage = `Error executing tool "${toolName}": ${error.message}`
      this.onToolCall?.({
        toolName,
        arguments: toolArguments,
        result: null,
        error: errorMessage,
      })
      return errorMessage
    }
  }

  private async handleToolCalls(toolCalls: any[]): Promise<void> {
    const toolExecutions = toolCalls.map(async (toolCall) => {
      const result = await this.executeTool(
        toolCall.function.name,
        toolCall.function.arguments
      )

      return {
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: typeof result === 'string' ? result : JSON.stringify(result),
      }
    })

    const toolResults = await Promise.all(toolExecutions)

    this.messages.push(...toolResults)
    this.onMessage?.(this.messages)
  }

  private extractReasoning(message: any): {
    reasoning: string
    content: string
  } {
    let reasoning = message?.reasoning || message?.reasoning_content || ''
    let content = message?.content || ''

    if (hasTag(content, 'thinking')) {
      reasoning = extractInnerTag(content, 'thinking')
      content = stripTag(content, 'thinking')
    } else if (hasTag(content, 'thought')) {
      reasoning = extractInnerTag(content, 'thought')
      content = stripTag(content, 'thought')
    }

    return { reasoning, content }
  }

  private buildResponse(
    responseData: Record<string, any>,
    latencyMs: number,
    reasoning: string,
    content: string,
    message: any
  ): Response {
    return {
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
        isReasoningModel:
          this.capabilities.isReasoningModel || reasoning.length > 0,
        ...(this.reasoning_effort && {
          reasoning_effort: this.reasoning_effort,
        }),
        hasThoughts: reasoning.length > 0,
      },
      fullResponse: responseData,
      completion: {
        role: message?.role || 'assistant',
        content: content.trim(),
        reasoning: reasoning.trim(),
        original: message?.content || '',
      },
    }
  }

  private buildErrorResponse(error: any, latencyMs: number): Response {
    return {
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
  }

  public async invoke(): Promise<Response> {
    const startTime = Date.now()

    try {
      const responseData = (await this.makeRequest()) as Record<string, any>
      const message = responseData.choices?.[0]?.message

      if (message) {
        this.messages.push(message)
        this.onMessage?.(this.messages)
      }

      if (message?.tool_calls?.length) {
        await this.handleToolCalls(message.tool_calls)
        return this.invoke()
      }

      const latencyMs = Date.now() - startTime
      const { reasoning, content } = this.extractReasoning(message)
      const response = this.buildResponse(
        responseData,
        latencyMs,
        reasoning,
        content,
        message
      )

      this.onComplete?.(response, this.messages)
      return response
    } catch (error: any) {
      const latencyMs = Date.now() - startTime
      const errorResponse = this.buildErrorResponse(error, latencyMs)

      this.onError?.(errorResponse.error)
      return Promise.reject(errorResponse.error)
    }
  }

  public async chat(prompt: string, bufferString?: string): Promise<Response> {
    this.setUserMessage(prompt, bufferString)
    return this.invoke()
  }

  private buildStreamMetadata(
    latencyMs: number,
    tokensUsed: any,
    reasoning: string
  ): Metadata {
    return {
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
      isReasoningModel: this.capabilities.isReasoningModel,
      ...(this.reasoning_effort && {
        reasoning_effort: this.reasoning_effort,
      }),
      hasThoughts: reasoning.length > 0,
    }
  }

  private async *processStream(
    response: Response,
    startTime: number
  ): StreamResponse {
    const reader = (response as any).body?.getReader()
    if (!reader) throw new Error('Stream not available')

    const decoder = new TextDecoder()
    let fullContent = ''
    let reasoning = ''
    let role = 'assistant'
    let buffer = ''
    let tokensUsed: any = undefined
    let toolCalls: ToolCall[] = []

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue

          if (trimmedLine.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmedLine.slice(6))
              const delta = parsed.choices?.[0]?.delta
              if (this.debug && delta) {
                console.log(
                  'STREAM: Received delta:',
                  JSON.stringify(delta, null, 2)
                )
              }

              if (delta?.role) role = delta.role

              if (delta?.tool_calls) {
                for (const toolCallDelta of delta.tool_calls) {
                  const index = toolCallDelta.index ?? toolCalls.length
                  if (!toolCalls[index]) {
                    toolCalls[index] = {
                      id: toolCallDelta.id || '',
                      type: 'function',
                      function: {
                        name: toolCallDelta.function?.name || '',
                        arguments: toolCallDelta.function?.arguments || '',
                      },
                    }
                  } else {
                    if (toolCallDelta.id) toolCalls[index].id = toolCallDelta.id
                    if (toolCallDelta.function?.name)
                      toolCalls[index].function.name =
                        toolCallDelta.function.name
                    if (toolCallDelta.function?.arguments)
                      toolCalls[index].function.arguments +=
                        toolCallDelta.function.arguments
                  }
                }
              }

              const deltaReasoning =
                delta?.reasoning || delta?.reasoning_content
              if (delta?.content || deltaReasoning) {
                fullContent += delta.content || ''
                reasoning += deltaReasoning || ''

                yield {
                  delta: delta.content,
                  reasoning: deltaReasoning,
                  fullContent,
                  done: false,
                }
              }

              if (parsed.usage) tokensUsed = parsed.usage
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      const message: Message = {
        role: role as MessageRole,
        content: fullContent,
      }
      if (toolCalls.length > 0) {
        message.tool_calls = toolCalls
      }

      this.messages.push(message)
      this.onMessage?.(this.messages)

      const latencyMs = Date.now() - startTime
      const metadata = this.buildStreamMetadata(
        latencyMs,
        tokensUsed,
        reasoning
      )
      const completion = {
        role,
        content: fullContent.trim(),
        reasoning: reasoning.trim(),
        original: fullContent,
      }

      const finalResponse: Response = { metadata, completion }
      this.onComplete?.(finalResponse, this.messages)

      yield {
        delta: '',
        fullContent: fullContent.trim(),
        reasoning: reasoning.trim(),
        done: true,
        metadata,
        completion,
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime
      const errorResponse = this.buildErrorResponse(error, latencyMs)

      this.onError?.(errorResponse.error)
      throw errorResponse.error
    }
  }

  public async stream(
    prompt: string,
    bufferString?: string
  ): Promise<StreamResponse> {
    this.setUserMessage(prompt, bufferString)
    return this.streamWithToolHandling()
  }

  private async *streamWithToolHandling(): StreamResponse {
    let iteration = 0

    while (iteration < this.maxToolInterations) {
      iteration++
      const startTime = Date.now()

      try {
        const response = await this.makeRequest(true)
        const stream = this.processStream(response as Response, startTime)

        let hasToolCalls = false

        for await (const chunk of stream) {
          if (chunk.done) {
            const lastMessage = this.messages[this.messages.length - 1]
            if (lastMessage?.tool_calls?.length) {
              hasToolCalls = true
            } else {
              // No tool calls, yield the final chunk
              yield chunk
            }
          } else {
            // Yield non-final chunks immediately
            yield chunk
          }
        }

        if (hasToolCalls) {
          const lastMessage = this.messages[this.messages.length - 1]
          if (lastMessage?.tool_calls) {
            await this.handleToolCalls(lastMessage.tool_calls)
          }

          continue
        }

        break
      } catch (error: any) {
        const latencyMs = Date.now() - startTime
        const errorResponse = this.buildErrorResponse(error, latencyMs)
        this.onError?.(errorResponse.error)
        throw errorResponse.error
      }
    }

    if (iteration >= this.maxToolInterations) {
      throw new Error('Max tool call iterations reached')
    }
  }
}
