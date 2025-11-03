import dedent from 'dedent'
import { z } from 'zod'
import { Micro } from './client'
import type { MicroOptions, Tool, Message, Metadata, Response } from './types'
import { createTool } from './tools/create-tool'
import { cleanEmptyList, slugify } from './utils/utils'

const SYSTEM_PROMPT_EXTRA = dedent`
You should think step by step in order to complete the task with reasoning divided in Thought/Action/Observation that can repeat multiple times if needed.
You should first think about it, then if necessary, use the tools to get the information you need.
Go back and forth between the tools and the context until you have a complete understanding of the task.
Do not repeat the same tool call in consecutive calls.
Now begin!
`

export type AgentOptions = Omit<MicroOptions, 'prompt'> & {
  name: string
  background: string
  goal?: string
  position?: string
  additionalInstructions?: string
  handoffs?: Agent[]
}

const AgentDefaults = {
  model: 'gpt-4o-mini',
}

export class Agent {
  private client: Micro
  public name: string
  public background: string
  public goal: string | undefined
  public position: string | undefined
  public handoffs?: Agent[]
  public tools?: Tool[]
  public model: string | undefined

  constructor(options: AgentOptions) {
    this.name = options.name
    this.background = options.background
    this.goal = options.goal
    this.handoffs = options.handoffs || []
    this.tools = options.tools || []
    this.position = options.position
    this.model = options.model

    const context = {
      role: options.name,
      background: options.background,
      goal: options.goal,
      additionalInstructions: options.additionalInstructions,
      toolsList: cleanEmptyList([
        this.handoffAgentToStringList(this.handoffs),
        this.toolsToStringList(this.tools),
      ]),
      ...(options.context || {}),
    }

    this.client = new Micro({
      systemPrompt: this.buildSystemPrompt({
        role: context.role,
        background: context.background,
        goal: context.goal,
        additionalInstructions: context.additionalInstructions,
        toolsList: context.toolsList || [],
      }),
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      model: this.model || AgentDefaults.model,
      debug: !!options.debug,
      context: context,
      messages: options.messages,
      reasoning: options.reasoning,
      reasoning_effort: options.reasoning_effort,
      timeout: options.timeout,
      stream: options.stream,
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

  private buildSystemPrompt(options: {
    role?: string
    background?: string
    goal?: string
    additionalInstructions?: string
    toolsList?: string[]
  }): string {
    const sections: string[] = []

    if (options?.role) {
      sections.push(`# ROLE\nYou are a ${options.role}.`)
    }

    if (options?.background) {
      sections.push(`## BACKGROUND\n${options.background}.`)
    }

    if (options?.goal) {
      sections.push(`## MAIN GOAL\n${options.goal}`)
    }

    if (options?.additionalInstructions) {
      sections.push(
        `## ADDITIONAL INSTRUCTIONS\n${options.additionalInstructions}`
      )
    }

    const toolsText = options?.toolsList?.length
      ? options.toolsList.join(', ')
      : '\n - None provided'
    sections.push(
      `## TOOL HINTS\nYou have access to the following tools: ${toolsText}`
    )

    sections.push(SYSTEM_PROMPT_EXTRA)

    return sections.join('\n\n')
  }

  private handoffAgentToTools(agents: Agent[]): Tool[] {
    return agents.map((agent) =>
      createTool(
        slugify(agent.name),
        dedent`You are a ${agent.name}. Use this tool to ${agent.goal ?? agent.background}`,
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
      return ''
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
      return ''
    }
    return (
      '\n' +
      agents
        .map(
          (agent) =>
            `- ${agent.name} [${slugify(agent.name)}]: Its role is to ${
              agent.background
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
