# MCP (Model Context Protocol) Integration

Micro AI has native support for Model Context Protocol (MCP) servers, allowing you to connect AI models to external tools and data sources seamlessly.

## What is MCP?

MCP is an open protocol that standardizes how AI applications connect to external tools and data sources. Instead of building custom integrations for each tool, you can use any MCP-compatible server with Micro AI.

## Quick Start

```typescript
import { Micro, createMCPTools } from 'micro-ai-ts'

// 1. Load tools from an MCP server (using npx - no installation needed!)
const tools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

// 2. Use with Micro client
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools,
})

// 3. AI automatically uses tools when needed
const response = await client.chat('Navigate to example.com and get the title')
```

## Prerequisites

**Node.js Native Servers (Recommended):**

- No additional setup required! Use `npx` to run TypeScript/JavaScript MCP servers

**Python-based Servers:**

- Requires `uv/uvx` installation:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or with Homebrew
brew install uv

# Or with pip
pip install uv
```

## API Reference

### `createMCPTools(config, toolNames?)`

Load tools from an MCP server.

**Parameters:**

- `config: MCPServerConfig` - Server configuration
  - `command: string` - Command to run (usually 'uvx')
  - `args: string[]` - Arguments for the command
  - `env?: Record<string, string>` - Optional environment variables
- `toolNames?: string[]` - Optional array of specific tool names to load

**Returns:** `Promise<Tool[]>` - Array of Micro AI tools

**Examples:**

```typescript
// Load all tools from a server (Node.js native - recommended)
const tools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

// Load specific tools only
const tools = await createMCPTools(
  { command: 'npx', args: ['-y', '@playwright/mcp'] },
  ['browser_navigate', 'browser_snapshot'] // only load specific tools
)

// Python-based server with environment variables
const tools = await createMCPTools({
  command: 'uvx',
  args: ['mcp-server-postgres'],
  env: {
    POSTGRES_CONNECTION_STRING: 'postgresql://...',
  },
})
```

### `createMCPTool(config, toolName)`

Load a single specific tool from an MCP server.

**Parameters:**

- `config: MCPServerConfig` - Server configuration
- `toolName: string` - Name of the tool to load

**Returns:** `Promise<Tool>` - Single Micro AI tool

**Example:**

```typescript
const navigateTool = await createMCPTool(
  { command: 'npx', args: ['-y', '@playwright/mcp'] },
  'browser_navigate'
)
```

### `MCPClient`

Low-level client for direct MCP server communication. Most users should use `createMCPTools` instead.

**Example:**

```typescript
import { MCPClient } from 'micro-ai-ts'

const client = new MCPClient({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

await client.connect()
const tools = await client.listTools()
const result = await client.callTool('browser_navigate', {
  url: 'https://example.com',
})
await client.disconnect()
```

## Popular MCP Servers

### Node.js/TypeScript Native (Recommended)

#### Playwright Server

Browser automation - navigate, click, type, scrape websites. **No installation required!**

```typescript
const tools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})
```

**Tools:** `browser_navigate`, `browser_click`, `browser_type`, `browser_select_option`, `browser_hover`, `browser_evaluate`, `browser_wait_for`, `browser_snapshot`, `browser_take_screenshot`, `browser_console_messages`, `browser_press_key`, `browser_close`

**Use Cases:** Web scraping, form automation, testing, research, competitive analysis

**See:** [Playwright Guide](../examples/mcp/PLAYWRIGHT.md)

#### Filesystem Server

Read local files (read-only access). **No installation required!**

```typescript
const tools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
})
```

**Tools:** `read_file`, `read_multiple_files`, `list_directory`, `search_files`, `get_file_info`

#### Git Server

Git repository operations. **No installation required!**

```typescript
const tools = await createMCPTools({
  command: 'npx',
  args: [
    '-y',
    '@modelcontextprotocol/server-git',
    '--repository',
    '/path/to/repo',
  ],
})
```

**Tools:** `git_status`, `git_diff`, `git_log`, `git_commit`, etc.

### Python-based Servers (Requires uv/uvx)

#### Fetch Server

Fetch web content from URLs.

```typescript
const tools = await createMCPTools({
  command: 'uvx',
  args: ['mcp-server-fetch'],
})
```

**Tools:** `fetch`

#### SQLite Server

Query SQLite databases.

```typescript
const tools = await createMCPTools({
  command: 'uvx',
  args: ['mcp-server-sqlite', '--db-path', 'database.db'],
})
```

**Tools:** `read_query`, `write_query`, `create_table`, `list_tables`, etc.

#### PostgreSQL Server

Query PostgreSQL databases.

```typescript
const tools = await createMCPTools({
  command: 'uvx',
  args: ['mcp-server-postgres'],
  env: {
    POSTGRES_CONNECTION_STRING: 'postgresql://user:pass@localhost/db',
  },
})
```

**Tools:** `query`, `list_tables`, `describe_table`, etc.

### Community Servers

Find more MCP servers at:

- https://github.com/modelcontextprotocol/servers
- https://github.com/topics/mcp-server

## Usage Patterns

### With Micro Client

```typescript
import { Micro, createMCPTools } from 'micro-ai-ts'

const tools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools,
  onToolCall: (response) => {
    console.log(`Tool used: ${response.toolName}`)
  },
})

const response = await client.chat('Navigate to example.com and get the title')
```

### With Agent

```typescript
import { Agent, createMCPTools } from 'micro-ai-ts'

const tools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

const agent = Agent.create({
  name: 'Research Assistant',
  background: 'Help users research topics using web content',
  tools,
})

const response = await agent.chat('Research TypeScript features on the web')
```

### With Orchestrator

```typescript
import { Orchestrator, Agent, createMCPTools } from 'micro-ai-ts'

const browserTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

const fileTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './'],
})

const researcher = Agent.create({
  name: 'Researcher',
  tools: browserTools,
})

const analyst = Agent.create({
  name: 'Analyst',
  tools: fileTools,
})

const orchestrator = Orchestrator.create({
  name: 'Team Lead',
  handoffs: [researcher, analyst],
})
```

### Multiple MCP Servers

Combine tools from multiple MCP servers:

```typescript
const browserTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

const fileTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './'],
})

const gitTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git', '--repository', './'],
})

const client = new Micro({
  tools: [...browserTools, ...fileTools, ...gitTools],
})
```

### Streaming with MCP

MCP tools work seamlessly with streaming:

```typescript
const tools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools,
})

const stream = await client.stream(
  'Navigate to example.com and summarize the content'
)

for await (const chunk of stream) {
  if (!chunk.done) {
    process.stdout.write(chunk.delta)
  }
}
```

## Advanced Usage

### Custom MCP Server

If you have a custom MCP server:

```typescript
const tools = await createMCPTools({
  command: 'node',
  args: ['./my-custom-mcp-server.js'],
  env: {
    API_KEY: process.env.MY_API_KEY,
  },
})
```

### Error Handling

```typescript
try {
  const tools = await createMCPTools({
    command: 'uvx',
    args: ['mcp-server-fetch'],
  })
} catch (error) {
  console.error('Failed to load MCP tools:', error.message)
  // Handle error (e.g., server not installed, connection failed)
}

// Tool execution errors are handled automatically
const client = new Micro({
  tools,
  onToolCall: (response) => {
    if (response.error) {
      console.error('Tool error:', response.error)
    }
  },
})
```

### Lifecycle Management

MCP servers run as child processes. They're automatically cleaned up when your Node.js process exits. For long-running applications, you may want to manage the lifecycle:

```typescript
import { MCPClient } from 'micro-ai-ts'

const client = new MCPClient({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

await client.connect()

// Use the client...

// Clean up when done
await client.disconnect()
```

## Troubleshooting

### "uvx: command not found"

Install uv/uvx:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Or visit: https://docs.astral.sh/uv/getting-started/installation/

### "MCP server not responding"

1. Check that the MCP server package exists
2. Verify server arguments are correct
3. Check server logs (stderr output)
4. Try running the server command manually to test

### "Tool not found"

1. List available tools first:

   ```typescript
   const client = new MCPClient({ command: 'uvx', args: ['mcp-server-name'] })
   await client.connect()
   const tools = await client.listTools()
   console.log(tools.map((t) => t.name))
   ```

2. Some servers require specific configuration or environment variables

### Performance Considerations

- MCP servers run as separate processes (stdio communication)
- First tool call may be slower (server initialization)
- Subsequent calls are fast (server stays alive)
- Multiple tools from the same server share one process

## Examples

See the [examples/mcp](../examples/mcp/) directory for complete working examples:

- `fetch-example.ts` - Basic web fetching
- `filesystem-example.ts` - File system access
- `agent-with-mcp.ts` - Agent using MCP tools
- `streaming-with-mcp.ts` - Streaming with MCP
- `simple-test.ts` - Quick integration test

## Learn More

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Micro AI Documentation](../README.md)
