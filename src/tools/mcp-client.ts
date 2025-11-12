import { spawn, type ChildProcess } from 'child_process'

export type MCPToolSchema = {
  name: string
  description?: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, any>
    required?: string[]
  }
}

export type MCPServerConfig = {
  command: string
  args: string[]
  env?: Record<string, string>
}

// MCP request timeout in milliseconds (30 seconds)
const MCP_REQUEST_TIMEOUT_MS = 30000

/**
 * MCP Protocol Client
 * Handles communication with MCP servers via stdio
 */
export class MCPClient {
  private process: ChildProcess | null = null
  private messageId = 0
  private pendingRequests = new Map<
    number,
    { resolve: (value: any) => void; reject: (error: any) => void }
  >()
  private buffer = ''
  private isInitialized = false

  constructor(private config: MCPServerConfig) {}

  /**
   * Start the MCP server and initialize connection
   */
  async connect(): Promise<void> {
    if (this.process) {
      return
    }

    return new Promise((resolve, reject) => {
      this.process = spawn(this.config.command, this.config.args, {
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      if (!this.process.stdout || !this.process.stdin) {
        reject(new Error('Failed to create MCP server process'))
        return
      }

      this.process.stdout.on('data', (data: Buffer) => {
        this.handleData(data)
      })

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error('[MCP Server Error]:', data.toString())
      })

      this.process.on('error', (error) => {
        reject(error)
      })

      this.process.on('exit', (code) => {
        console.log(`[MCP Server] Process exited with code ${code}`)
        this.cleanup()
      })

      // Initialize the connection
      this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'micro-ai-ts',
          version: '0.6.4',
        },
      })
        .then(() => {
          this.isInitialized = true
          resolve()
        })
        .catch(reject)
    })
  }

  /**
   * Handle incoming data from MCP server
   */
  private handleData(data: Buffer): void {
    this.buffer += data.toString()

    // Process complete JSON-RPC messages
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const message = JSON.parse(line)
        this.handleMessage(message)
      } catch (error) {
        console.error('[MCP Client] Failed to parse message:', line, error)
      }
    }
  }

  /**
   * Handle a parsed JSON-RPC message
   */
  private handleMessage(message: any): void {
    if (message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id)
      if (pending) {
        this.pendingRequests.delete(message.id)
        if (message.error) {
          pending.reject(new Error(message.error.message || 'MCP Error'))
        } else {
          pending.resolve(message.result)
        }
      }
    }
  }

  /**
   * Send a JSON-RPC request to the MCP server
   */
  private sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin) {
        reject(new Error('MCP server not connected'))
        return
      }

      const id = ++this.messageId
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      }

      this.pendingRequests.set(id, { resolve, reject })

      try {
        this.process.stdin.write(JSON.stringify(request) + '\n')
      } catch (error) {
        this.pendingRequests.delete(id)
        reject(error)
      }

      // Timeout after configured duration
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error(`Request timeout: ${method}`))
        }
      }, MCP_REQUEST_TIMEOUT_MS)
    })
  }

  /**
   * List all available tools from the MCP server
   */
  async listTools(): Promise<MCPToolSchema[]> {
    if (!this.isInitialized) {
      await this.connect()
    }

    const response = await this.sendRequest('tools/list')
    return response.tools || []
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: any): Promise<any> {
    if (!this.isInitialized) {
      await this.connect()
    }

    const response = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    })

    // Extract content from MCP response
    if (response.content && Array.isArray(response.content)) {
      // Combine all text content
      return response.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('\n')
    }

    return response
  }

  /**
   * Close the connection and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill()
      this.cleanup()
    }
  }

  private cleanup(): void {
    this.process = null
    this.isInitialized = false
    this.pendingRequests.clear()
    this.buffer = ''
  }
}
