import dedent from 'dedent'
import { z } from 'zod'
import { Micro } from './client'
import type { MicroOptions, Tool, Message, Metadata, Response } from './types'
import { createTool } from './tools/create-tool'
import { slugify } from './utils/utils'

const SYSTEM_PROMPT = dedent`
You are a {{role}}. {{background}}

## MAIN GOAL
{{goal}}

## TOOL HINTS
You have access to the following tools: {{toolsList}}.

## ADDITIONAL INSTRUCTIONS
{{additionalInstructions}}

You should think step by step in order to complete the task with reasoning divided in Thought/Action/Observation that can repeat multiple times if needed.
You should first reflect with '<thought>{your_thoughts}</thought>', then if necessary, use the tools to get the information you need and print your final response with '<final>{your_final_response}</final>'.
Mark your final response with '<final>{your_final_response}</final>' tag if you have finished the task and no longer need to use the tools.
Go back and forth between the tools and the context until you have a complete understanding of the task.
Do not repeat the same tool call in consecutive calls.
Now begin! Reminder to ALWAYS use the exact characters <final>...<final/> when you provide a definitive answer.
`

export interface AgentOptions extends Omit<MicroOptions, 'prompt'> {
  name: string
  instructions: string
  handoffs?: Agent[]
  position?: string
}

const AgentDefaults = {
  model: 'gpt-4o-mini',
}

export class Agent {
  private client: Micro
  public name: string
  public instructions: string
  public handoffs?: Agent[]
  public tools?: Tool[]
  public position: string | undefined
  public model: string | undefined

  constructor(options: AgentOptions) {
    this.name = options.name
    this.instructions = options.instructions
    this.handoffs = options.handoffs
    this.tools = options.tools || []
    this.position = options.position
    this.model = options.model

    const context = {
      role: options.name,
      background: options.instructions,
      goal: options.instructions,
      additionalInstructions: options.instructions,
      toolsList: [
        this.handoffAgentToStringList(this.handoffs || []),
        this.toolsToStringList(this.tools || []),
      ],
      ...(options.context || {}),
    }

    this.client = new Micro({
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0,
      model: this.model || AgentDefaults.model,
      debug: options.debug || false,
      context: context,
      messages: options.messages,
      reasoning: options.reasoning,
      reasoning_effort: options.reasoning_effort,
      timeout: options.timeout,
      streaming: options.streaming,
      tool_choice: options.tool_choice,
      onComplete: options.onComplete,
      onMessage: options.onMessage,
      onRequest: options.onRequest,
      onResponseData: options.onResponseData,
      onError: options.onError,
      onToolCall: options.onToolCall,
      ...(this.handoffs && this.handoffs.length > 0
        ? {
            tools: [
              ...(options.tools || []),
              ...this.handoffAgentToTools(this.handoffs),
            ],
          }
        : { tools: options.tools }),
    })
  }

  private handoffAgentToTools(agents: Agent[]): Tool[] {
    return agents.map((agent) =>
      createTool(
        slugify(agent.name),
        `You are a ${agent.name}. Use this tool to ${agent.instructions}`,
        z.object({
          prompt: z.string().describe('The prompt of the request.'),
        }),
        async ({ prompt }) => {
          const response = await agent.chat(prompt)
          return response?.completion?.content || response
        }
      )
    )
  }

  private toolsToStringList(tools: Tool[]): string {
    if (!tools || tools.length === 0) {
      return 'None'
    }
    return (
      '\n' +
      tools
        .map(
          (tool) =>
            `- ${tool.schema.function.name} [${slugify(tool.schema.function.name)}]: Its role is to ${
              tool.schema.function.description
            }`
        )
        .join('\n')
    )
  }

  private handoffAgentToStringList(agents: Agent[]): string {
    if (!agents || agents.length === 0) {
      return 'None'
    }
    return (
      '\n' +
      agents
        .map(
          (agent) =>
            `- ${agent.name} [${slugify(agent.name)}]: Its role is to ${
              agent.instructions
            }`
        )
        .join('\n')
    )
  }

  public async invoke(): Promise<Response> {
    return this.client.invoke()
  }

  public async chat(prompt: string): Promise<Response> {
    this.addPrompt(prompt)
    return this.client.invoke()
  }

  public getMessages(): Message[] {
    return this.client.getMessages()
  }

  public addPrompt(msg: string): void {
    this.client.setUserMessage(msg)
  }

  public addAssistantPrompt(msg: string): void {
    this.client.setAssistantMessage(msg)
  }

  public getMetadata(): Metadata {
    return this.client.getMetadata()
  }

  public static create(options: AgentOptions): Agent {
    return new Agent(options)
  }
}

export class Orchestrator extends Agent {
  constructor(options: AgentOptions) {
    super({ ...options, position: 'orchestrator' })
  }

  public static create(options: AgentOptions): Orchestrator {
    return new Orchestrator({ ...options, position: 'orchestrator' })
  }
}
