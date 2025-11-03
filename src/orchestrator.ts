import { Agent, type AgentOptions } from './agent'

export class Orchestrator extends Agent {
  constructor(options: AgentOptions) {
    super({ ...options, position: 'orchestrator' })
  }

  public static create(options: AgentOptions): Orchestrator {
    return new Orchestrator({ ...options, position: 'orchestrator' })
  }
}
