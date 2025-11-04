# Micro AI Beginner's Guide

Welcome! This guide will help you understand and use Micro AI, even if you've never worked with AI language models before.

## What is Micro AI?

Micro AI is a TypeScript library that makes it easy to add AI capabilities to your applications. Think of it as a friendly translator between your code and powerful AI models like ChatGPT, Claude, or Gemini.

Instead of learning different APIs for each AI provider, you write code once and it works with all of them.

## What Can You Build?

- **Chatbots** - Create conversational assistants for your website or app
- **Smart Tools** - Build AI that can search the web, call APIs, or interact with databases
- **Multi-Agent Systems** - Coordinate multiple AI assistants that work together
- **Reasoning Applications** - Use advanced AI models that can "think through" complex problems

## Core Concepts

### 1. Micro (The Client)

This is the basic building block. It lets you send messages to an AI and get responses back.

**Think of it like:** A phone call with an AI assistant. You talk, it listens and responds.

```typescript
import { Micro } from 'micro-ai-ts'

const client = new Micro({
  model: 'openai:gpt-4.1-mini',
})

const response = await client.chat('What is the capital of France?')
console.log(response.completion.content) // "Paris"
```

### 2. Tools

Tools give your AI the ability to perform actions beyond text generation. Both the Micro client and Agent can use tools.

**Think of it like:** Giving your AI hands to interact with the world - check the weather, search the web, perform calculations, or call APIs.

```typescript
import { Micro, createTool } from 'micro-ai-ts'
import { z } from 'zod'

const weatherTool = createTool(
  'get_weather',
  'Get current weather for a location',
  z.object({ city: z.string() }),
  async ({ city }) => {
    // Your weather API call here
    return `The weather in ${city} is sunny, 72°F`
  }
)

// Use tools with Micro client
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools: [weatherTool],
})

const response = await client.chat("What's the weather in Paris?")
// The tool is automatically called and the result is used in the response
```

### 3. Agent

An agent is a specialized AI with a defined role and purpose. Agents can also use tools, just like the Micro client.

**Think of it like:** A specialized team member with a specific job description and expertise.

```typescript
import { Agent } from 'micro-ai-ts'

const agent = Agent.create({
  name: 'WeatherBot',
  background: 'You help users check the weather using available tools',
  model: 'openai:gpt-4.1-mini',
  tools: [weatherTool],
})

const response = await agent.chat("What's the weather in Paris?")
// The agent will automatically call the weather tool and respond
```

### 4. Orchestrator

An orchestrator coordinates multiple specialized agents. It's like a manager who delegates tasks to the right team member.

**Think of it like:** A project manager who knows which expert to ask for each type of question.

```typescript
import { Agent, Orchestrator } from 'micro-ai-ts'

const weatherAgent = Agent.create({
  name: 'Weather Expert',
  background: 'You provide weather information',
  tools: [weatherTool],
})

const newsAgent = Agent.create({
  name: 'News Expert',
  background: 'You provide latest news',
  tools: [newsTool],
})

const orchestrator = Orchestrator.create({
  name: 'Main Assistant',
  background: 'You coordinate between weather and news experts',
  handoffs: [weatherAgent, newsAgent],
})
```

### 5. Streaming

Streaming lets you see the AI's response as it's being generated, token by token, instead of waiting for the complete response.

**Think of it like:** Watching someone type a message in real-time vs. receiving the entire message at once.

```typescript
import { Micro } from 'micro-ai-ts'

const client = new Micro({
  model: 'openai:gpt-4o-mini',
  tools: [calculatorTool], // Tools work with streaming too!
})

// Stream the response (tools are called automatically)
const stream = await client.stream('What is 25 times 4? Write a poem about it.')

for await (const chunk of stream) {
  if (!chunk.done) {
    // Print each word as it arrives
    process.stdout.write(chunk.delta)
  } else {
    // Final chunk with complete response
    console.log('\n\nDone!')
  }
}
```

**When to use streaming:**

- Building chat interfaces where users want to see responses appear gradually
- Long responses where you want to show progress
- Better perceived performance (users see output faster)

**When to use regular chat:**

- Batch processing where you need the complete response
- When you need to process the entire response before showing it
- Simpler code when real-time updates aren't needed

## Your First LLM Interaction

Let's build a simple chatbot step by step.

### Step 1: Install Micro AI

```bash
npm install git+https://github.com/thinnker/micro-ai-ts.git
# or
pnpm add git+https://github.com/thinnker/micro-ai-ts.git
# or
yarn add git+https://github.com/thinnker/micro-ai-ts.git
```

### Step 2: Get an API Key

You need an API key from an AI provider. The easiest to start with is OpenAI:

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy it somewhere safe

### Step 3: Set Up Your Environment

Create a `.env` file in your project:

```env
OPENAI_API_KEY=your-api-key-here
```

### Step 4: Write Your First Code

Create a file called `my-first-bot.ts`:

```typescript
import { Micro } from 'micro-ai-ts'

async function main() {
  // Create a client
  const client = new Micro({
    model: 'openai:gpt-4.1-mini',
    systemPrompt: 'You are a helpful assistant who speaks like a pirate.',
  })

  // Send a message
  const response = await client.chat('Tell me a joke')

  // Print the response
  console.log(response.completion.content)

  // Continue the conversation
  const response2 = await client.chat('Tell me another one')
  console.log(response2.completion.content)
}

main()
```

### Step 5: Run It

```bash
npx tsx my-first-bot.ts
```

You should see the AI respond with pirate-themed jokes!

## Understanding Conversations

Micro automatically remembers your conversation history. Each time you call `chat()`, it includes previous messages.

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
})

await client.chat('My name is Alice')
await client.chat('What is my name?') // AI remembers: "Your name is Alice"

// See the full conversation
console.log(client.getMessages())
```

### Managing Conversation History

```typescript
// Limit to last 10 messages (useful for long conversations)
client.limitMessages(10)

// Clear all messages and start fresh
client.flushAllMessages()

// Manually set messages
client.setMessages([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
])
```

## Using Template Variables

You can inject dynamic values into your prompts using the `context` option:

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  systemPrompt: 'You are {{role}}. Your expertise is {{expertise}}.',
  context: {
    role: 'a friendly teacher',
    expertise: 'explaining complex topics simply',
  },
})

// The system prompt becomes:
// "You are a friendly teacher. Your expertise is explaining complex topics simply."
```

## Using Tools

Tools let your AI perform actions. You can use tools with both the Micro client and Agents. Here's how to create them:

### Step 1: Define What the Tool Does

```typescript
import { createTool } from 'micro-ai-ts'
import { z } from 'zod'

// Create a calculator tool
const calculatorTool = createTool(
  'calculate',
  'Perform mathematical calculations',
  z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  async ({ operation, a, b }) => {
    switch (operation) {
      case 'add':
        return a + b
      case 'subtract':
        return a - b
      case 'multiply':
        return a * b
      case 'divide':
        return a / b
    }
  }
)
```

### Step 2: Use the Tool

```typescript
// Option 1: With Micro client
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools: [calculatorTool],
})

const response = await client.chat('What is 15 times 23?')
console.log(response.completion.content)

// Option 2: With Agent
const mathAgent = Agent.create({
  name: 'MathTutor',
  background: 'You help students with math problems',
  model: 'openai:gpt-4.1-mini',
  tools: [calculatorTool],
})

const response2 = await mathAgent.chat('What is 15 times 23?')
console.log(response2.completion.content)
```

### How Tools Work

1. You ask the agent a question
2. The AI decides if it needs to use a tool
3. If yes, it calls the tool with the right parameters
4. The tool executes and returns a result
5. The AI uses that result to answer your question

### Real-World Tool Example: Web Search

```typescript
const searchTool = createTool(
  'web_search',
  'Search the internet for information',
  z.object({
    query: z.string().describe('The search query'),
  }),
  async ({ query }) => {
    // Call a search API (like Brave, Google, etc.)
    const results = await fetch(`https://api.search.com?q=${query}`)
    return await results.json()
  }
)

// Use with Micro client for simple queries
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools: [searchTool],
})

await client.chat('What are the latest developments in AI?')

// Or use with Agent for more complex workflows
const researchAgent = Agent.create({
  name: 'Researcher',
  background: 'You help users find information online',
  tools: [searchTool],
})

await researchAgent.chat('Research AI trends and create a summary')
```

## Multi-Agent Orchestration

Sometimes you need multiple specialized agents working together. Here's how:

### Pattern 1: Simple Handoff

Create specialized agents and let an orchestrator delegate:

```typescript
// Create specialized agents
const codeAgent = Agent.create({
  name: 'CodeExpert',
  background: 'You write and explain code',
  model: 'openai:gpt-4.1-mini',
})

const designAgent = Agent.create({
  name: 'DesignExpert',
  background: 'You help with UI/UX design',
  model: 'openai:gpt-4.1-mini',
})

// Create orchestrator
const orchestrator = Orchestrator.create({
  name: 'ProjectManager',
  background:
    'You coordinate between code and design experts. ' +
    'Delegate coding questions to CodeExpert and design questions to DesignExpert.',
  model: 'openai:gpt-4.1-mini',
  handoffs: [codeAgent, designAgent],
})

// The orchestrator will automatically route questions
await orchestrator.chat('How do I center a div in CSS?')
// Routes to CodeExpert

await orchestrator.chat('What colors work well for a tech startup?')
// Routes to DesignExpert
```

### Pattern 2: Sequential Workflow

Agents can work in sequence, each building on the previous:

```typescript
const researchAgent = Agent.create({
  name: 'Researcher',
  background: 'You gather information on topics',
  tools: [searchTool],
})

const writerAgent = Agent.create({
  name: 'Writer',
  background: 'You write articles based on research',
})

// First, research
const research = await researchAgent.chat('Research AI trends in 2025')

// Then, write based on research
writerAgent.setUserMessage(
  `Write an article based on this research: ${research.completion.content}`
)
const article = await writerAgent.invoke()
```

### Pattern 3: Collaborative Agents

Multiple agents can contribute to a single conversation:

```typescript
const orchestrator = Orchestrator.create({
  name: 'TeamLead',
  background: 'You coordinate a team of experts to solve complex problems',
  handoffs: [
    Agent.create({
      name: 'DataAnalyst',
      background: 'You analyze data and provide insights',
      tools: [dataAnalysisTool],
    }),
    Agent.create({
      name: 'Strategist',
      background: 'You develop strategies based on data',
    }),
    Agent.create({
      name: 'Implementer',
      background: 'You create action plans',
    }),
  ],
})

await orchestrator.chat(
  'How can we improve our product based on user feedback?'
)
// Orchestrator will coordinate between all three agents
```

### Real-World Orchestrator Examples

Here are some practical orchestrator patterns you can use:

**Travel Agency System:**
Coordinate flight booking, hotel reservations, and travel advice agents to provide comprehensive travel planning.

```typescript
const travelOrchestrator = Orchestrator.create({
  name: 'Travel Agency Manager',
  background: 'Route travel requests to specialized agents',
  handoffs: [flightAgent, hotelAgent, advisorAgent],
})
```

**Content Creation Team:**
Manage blog writers, social media specialists, SEO experts, and copy editors working together.

```typescript
const contentDirector = Orchestrator.create({
  name: 'Content Director',
  background: 'Coordinate content creation workflow',
  handoffs: [blogWriter, socialMediaExpert, seoExpert, copyEditor],
})
```

**Healthcare Triage:**
Route health questions to appropriate specialists (general practitioner, mental health, nutrition, fitness).

```typescript
const healthcareOrchestrator = Orchestrator.create({
  name: 'Healthcare Triage Coordinator',
  background: 'Route health questions to appropriate specialists',
  handoffs: [
    generalPractitioner,
    mentalHealthCounselor,
    nutritionist,
    fitnessCoach,
  ],
})
```

See the [orchestrator examples](../examples/orchestrator) folder for complete implementations.

## Using Reasoning Models

Reasoning models are special AI models that can "think through" complex problems step by step. They're great for:

- Math and logic problems
- Code debugging
- Complex analysis
- Strategic planning

### What Makes Them Different?

Regular models respond quickly with their first answer. Reasoning models take time to think, showing their thought process.

### How to Use Them

```typescript
const reasoningClient = new Micro({
  model: 'openai:gpt-5-nano', // A reasoning model
  reasoning: true,
  reasoning_effort: 'medium', // 'low', 'medium', or 'high'
})

const response = await reasoningClient.chat(
  'If a train leaves Station A at 60mph and another leaves Station B ' +
    '(100 miles away) at 40mph, when do they meet?'
)

// See the AI's thinking process
console.log('Thinking:', response.completion.reasoning)

// See the final answer
console.log('Answer:', response.completion.content)
```

### Supported Reasoning Models

**OpenAI:**

- `openai:gpt-5-mini` - Fast reasoning
- `openai:gpt-5-nano` - Super fast reasoning
- `openai:gpt-5` - Advanced reasoning
- `openai:o1-mini` - Fast reasoning
- `openai:o1` - Advanced reasoning
- `openai:o3-mini` - Latest fast reasoning

**Google:**

- `gemini:gemini-2.5-pro` - Advanced reasoning
- `gemini:gemini-2.5-flash` - Fast reasoning
- `gemini:gemini-2.5-flash-lite` - Super fast reasoning

**DeepSeek:**

- `deepseek:deepseek-reasoner` - Open-source reasoning

**Alibaba:**

- `openrouter:glm-4.5-air` - Fast reasoning
- `openrouter:glm-4.5` - Advanced reasoning
- `openrouter:glm-4.6` - Advanced reasoning

### Reasoning Effort Levels

```typescript
// Low effort - faster, less thorough
reasoning_effort: 'low'

// Medium effort - balanced (default)
reasoning_effort: 'medium'

// High effort - slower, more thorough
reasoning_effort: 'high'
```

### When to Use Reasoning Models

✅ **Good for:**

- Complex math problems
- Code debugging and optimization
- Strategic analysis
- Multi-step reasoning
- Problems requiring careful thought

❌ **Not ideal for:**

- Simple questions
- Creative writing
- Quick responses
- Casual conversation

## Event Hooks and Monitoring

Event hooks let you monitor what's happening with your AI:

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',

  // Called when a response is received
  onComplete: (result) => {
    console.log('Response received:', result.completion.content)
    console.log('Tokens used:', result.metadata.tokensUsed)
  },

  // Called when conversation history changes
  onMessage: (messages) => {
    console.log('Conversation now has', messages.length, 'messages')
  },

  // Called when a tool is executed
  onToolCall: (toolResponse) => {
    console.log('Tool called:', toolResponse.toolName)
    console.log('Result:', toolResponse.result)
  },

  // Called when an error occurs
  onError: (error) => {
    console.error('Error:', error.message)
  },
})
```

### Practical Use Cases

**Logging:**

```typescript
onComplete: (result) => {
  fs.appendFileSync(
    'ai-log.txt',
    `${new Date().toISOString()}: ${result.completion.content}\n`
  )
}
```

**Cost Tracking:**

```typescript
let totalTokens = 0

onComplete: (result) => {
  totalTokens += result.metadata.tokensUsed.total
  console.log(`Total tokens used: ${totalTokens}`)
}
```

**Debugging:**

```typescript
onRequest: (request) => {
  console.log('Sending request:', JSON.stringify(request, null, 2));
},

onResponseData: (response) => {
  console.log('Raw response:', JSON.stringify(response, null, 2));
}
```

## Working with Images (Vision)

Some models can understand images. Here's how to use them:

```typescript
import { Micro } from 'micro-ai-ts'
import fs from 'fs'

// Read image and convert to base64
const imageBuffer = fs.readFileSync('./photo.jpg')
const base64Image = imageBuffer.toString('base64')
const bufferString = `data:image/jpeg;base64,${base64Image}`

const client = new Micro({
  model: 'openai:gpt-4o', // Vision-capable model
})

const response = await client.chat(
  'What do you see in this image?',
  bufferString
)

console.log(response.completion.content)
```

## Troubleshooting

### Problem: "API key not found"

**Solution:** Make sure you've set your API key in the environment:

```typescript
// Option 1: .env file
OPENAI_API_KEY = your - key - here

// Option 2: Set in code (not recommended for production)
process.env.OPENAI_API_KEY = 'your-key-here'

// Option 3: Pass directly to provider
const client = new Micro({
  provider: {
    apiKey: 'your-key-here',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
})
```

### Problem: "Request timeout"

**Solution:** Increase the timeout or check your network:

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  timeout: 60000, // 60 seconds (default is 30)
})
```

### Problem: "Tool not being called"

**Checklist:**

1. Is the tool description clear?
2. Is the schema correct?
3. Is the model capable of tool calling? (gpt-3.5-turbo and above)
4. Try being more explicit in your prompt

```typescript
// Instead of:
await agent.chat("What's the weather?")

// Try:
await agent.chat('Use the weather tool to check the weather in Paris')
```

### Problem: "Response is too long/short"

**Solution:** Adjust `maxTokens`:

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  maxTokens: 500, // Limit response length
})
```

### Problem: "Responses are too random/creative"

**Solution:** Lower the temperature:

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  temperature: 0.3, // Lower = more focused (0-2, default is 1)
})
```

### Problem: "AI keeps calling wrong tool"

**Solution:** Improve tool descriptions:

```typescript
const tool = createTool(
  'search_database',
  // Bad: 'Search'
  // Good: 'Search the product database for items matching a query. Use this when users ask about products, inventory, or availability.',
  schema,
  execute
)

// With Micro client
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  tools: [searchTool, orderTool],
})

// With Agent (can provide more context)
const agent = Agent.create({
  name: 'ShopAssistant',
  // Bad: 'You help users'
  // Good: 'You help users find products. When they ask about products, use the search_database tool. When they ask about orders, use the check_order tool.',
  background: '...',
  tools: [searchTool, orderTool],
})
```

### Problem: "Out of memory with long conversations"

**Solution:** Limit message history:

```typescript
// Keep only last 20 messages
client.limitMessages(20)

// Or manually manage messages
const messages = client.getMessages()
const recentMessages = messages.slice(-10) // Last 10 messages
client.setMessages(recentMessages)
```

### Problem: "Rate limit errors"

**Solution:** Add retry logic or slow down requests:

```typescript
async function chatWithRetry(client, prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.chat(prompt)
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, i))
        )
        continue
      }
      throw error
    }
  }
}
```

## Best Practices

### 1. Write Clear Instructions

```typescript
// ❌ Bad
background: 'Help users'

// ✅ Good
background: 'You are a customer support agent for an e-commerce store. ' +
  'Be friendly and professional. Always verify order numbers before ' +
  'providing order information. If you cannot help, escalate to a human agent.'
```

### 2. Handle Errors Gracefully

```typescript
try {
  const response = await client.chat(userInput)

  // Errors from providers will be here (like "Model name does not exist")
  if (response.error) {
    console.error('Failed to get AI response:', response.error.message)
    return
  }

  console.log(response.completion.content)
} catch (error) {
  // Error like no API Keys etc will be here
  console.error('Failed to get AI response:', error.message)
  // Show user-friendly error message
  console.log("Sorry, I'm having trouble right now. Please try again.")
}
```

### 3. Monitor Token Usage

```typescript
const client = new Micro({
  model: 'openai:gpt-4.1-mini',
  onComplete: (result) => {
    const tokens = result.metadata.tokensUsed.total
    if (tokens > 3000) {
      console.warn(
        'High token usage detected. Consider limiting conversation history.'
      )
    }
  },
})
```

## Next Steps

Now that you understand the basics, try:

1. **Build a simple chatbot** - Start with basic conversation
2. **Add one tool** - Give your AI a simple capability
3. **Create a specialized agent** - Build an agent for a specific task
4. **Experiment with reasoning models** - Try solving complex problems
5. **Build a multi-agent system** - Coordinate multiple agents

Check out the [examples folder](../examples) for complete, runnable code examples.

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Examples**: See working code in the `examples/` folder
- **README**: Quick reference for API methods

Happy building! 🚀
