# MCP Quick Start Guide

Get started with MCP (Model Context Protocol) in Micro AI in 5 minutes.

## 1. Set Up Your Project

```bash
# Install Micro AI (if not already installed)
pnpm add git+https://github.com/thinnker/micro-ai-ts.git

# Set up environment variables
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

## 2. Write Your First MCP Code

Create `mcp-demo.ts`:

```typescript
import { Micro, createMCPTools } from 'micro-ai-ts'

async function main() {
  // Load MCP tools (no installation needed - uses npx!)
  const tools = await createMCPTools({
    command: 'npx',
    args: ['-y', '@playwright/mcp'],
  })

  // Create client with MCP tools
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    tools,
  })

  // Use it!
  const response = await client.chat(
    'Navigate to example.com and tell me what the page title is'
  )

  console.log(response.completion.content)
}

main()
```

## 3. Run It

```bash
pnpm dlx tsx mcp-demo.ts
```

## That's It!

You now have AI that can browse the web! The AI automatically decides when to use the tool. **No additional installation required** - npx handles everything.

## Next Steps

### Try Different MCP Servers

**Node.js Native (No installation needed!):**

```typescript
// Browser automation
const browserTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

// Read files
const fileTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './'],
})

// Git operations
const gitTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git', '--repository', './'],
})
```

**Python-based (Requires uv/uvx installation):**

```typescript
// Fetch web content
const fetchTools = await createMCPTools({
  command: 'uvx',
  args: ['mcp-server-fetch'],
})

// SQLite queries
const dbTools = await createMCPTools({
  command: 'uvx',
  args: ['mcp-server-sqlite', '--db-path', 'data.db'],
})
```

**Install uv/uvx for Python servers:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Combine Multiple Servers

```typescript
const browserTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

const fileTools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './'],
})

const client = new Micro({
  tools: [...browserTools, ...fileTools],
})
```

### Use with Agents

```typescript
import { Agent, createMCPTools } from 'micro-ai-ts'

const tools = await createMCPTools({
  command: 'npx',
  args: ['-y', '@playwright/mcp'],
})

const agent = Agent.create({
  name: 'Research Assistant',
  background: 'Help users research topics',
  tools,
})

const response = await agent.chat('Research TypeScript features on the web')
```

### Stream Responses

```typescript
const stream = await client.stream('Fetch and summarize https://example.com')

for await (const chunk of stream) {
  if (!chunk.done) {
    process.stdout.write(chunk.delta)
  }
}
```

## Common MCP Servers

**Node.js Native (Recommended - No installation!):**

| Server                                  | Purpose            | Command                                                                      |
| --------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| @playwright/mcp                         | Browser automation | `['npx', '-y', '@playwright/mcp']`                                           |
| @modelcontextprotocol/server-filesystem | Read files         | `['npx', '-y', '@modelcontextprotocol/server-filesystem', '/path']`          |
| @modelcontextprotocol/server-git        | Git operations     | `['npx', '-y', '@modelcontextprotocol/server-git', '--repository', '/path']` |

**Python-based (Requires uv/uvx):**

| Server              | Purpose           | Command                                              |
| ------------------- | ----------------- | ---------------------------------------------------- |
| mcp-server-fetch    | Fetch web content | `['uvx', 'mcp-server-fetch']`                        |
| mcp-server-sqlite   | SQLite queries    | `['uvx', 'mcp-server-sqlite', '--db-path', 'db.db']` |
| mcp-server-postgres | PostgreSQL        | `['uvx', 'mcp-server-postgres']` + env vars          |

Find more: https://github.com/modelcontextprotocol/servers

## Troubleshooting

**"npx: command not found"**

- Make sure Node.js is installed (npx comes with Node.js)
- Restart your terminal

**"uvx: command not found" (for Python servers)**

- Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Restart your terminal

**"MCP server not responding"**

- Check the server name is correct
- Try running the command manually to test (e.g., `npx -y @playwright/mcp`)
- Check stderr output for errors

**"Tool not found"**

- List available tools first to see what's available
- Some servers need specific arguments or env vars

## Learn More

- [Full MCP Documentation](../../docs/MCP.md)
- [MCP Examples](./README.md)
- [MCP Official Docs](https://modelcontextprotocol.io/)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
