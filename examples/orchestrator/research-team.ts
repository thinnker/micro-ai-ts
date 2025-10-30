import { Agent, Orchestrator, createTool } from '../../src/index'
import { z } from 'zod'

const webSearchTool = createTool(
  'web_search',
  'Search the web for information on a given topic',
  z.object({
    query: z.string().describe('The search query'),
    num_results: z
      .number()
      .optional()
      .describe('Number of results to return (default: 5)'),
  }),
  async ({ query, num_results = 5 }) => {
    return {
      query,
      results: [
        {
          title: `Result 1 for ${query}`,
          snippet: `This is a simulated search result about ${query}. It contains relevant information.`,
          url: 'https://example.com/1',
        },
        {
          title: `Result 2 for ${query}`,
          snippet: `Another simulated result with more details about ${query}.`,
          url: 'https://example.com/2',
        },
      ].slice(0, num_results),
      message: `Found ${num_results} results for "${query}"`,
    }
  }
)

const dataAnalysisTool = createTool(
  'analyze_data',
  'Analyze numerical data and provide statistical insights',
  z.object({
    data: z.array(z.number()).describe('Array of numbers to analyze'),
    analysis_type: z
      .enum(['summary', 'trend', 'comparison'])
      .describe('Type of analysis to perform'),
  }),
  async ({ data, analysis_type }) => {
    const sum = data.reduce((a: number, b: number) => a + b, 0)
    const avg = sum / data.length
    const min = Math.min(...data)
    const max = Math.max(...data)

    return {
      analysis_type,
      data_points: data.length,
      summary: {
        average: avg.toFixed(2),
        min,
        max,
        sum,
      },
      message: `Analysis complete: avg=${avg.toFixed(
        2
      )}, min=${min}, max=${max}`,
    }
  }
)

async function main() {
  const webResearchAgent = Agent.create({
    name: 'Web Research Specialist',
    background:
      'You are a web research specialist. Use the web_search tool to find information on topics. Summarize findings clearly and cite sources.',
    model: 'openai:gpt-4.1-mini',
    tools: [webSearchTool],
    temperature: 0.4,
  })

  const dataAnalystAgent = Agent.create({
    name: 'Data Analyst',
    background:
      'You are a data analyst. Use the analyze_data tool to perform statistical analysis. Explain findings in clear, non-technical language.',
    model: 'openai:gpt-4.1-mini',
    tools: [dataAnalysisTool],
    temperature: 0.3,
  })

  const reportWriterAgent = Agent.create({
    name: 'Report Writer',
    background:
      'You are a report writer. Synthesize information from other specialists into clear, well-structured reports. Use professional language and organize information logically.',
    model: 'openai:gpt-4.1-mini',
    temperature: 0.6,
  })

  const orchestrator = Orchestrator.create({
    name: 'Research Team Lead',
    background:
      'You are a research team lead coordinating a team of specialists. Delegate research tasks to the Web Research Specialist, data analysis to the Data Analyst, and report writing to the Report Writer. Coordinate their work to produce comprehensive results.',
    model: 'openai:gpt-4.1-mini',
    handoffs: [webResearchAgent, dataAnalystAgent, reportWriterAgent],
    temperature: 0.5,
  })

  console.log('Research Task: Market Analysis')
  console.log(
    'User: I need research on TypeScript adoption trends and a summary report.\n'
  )

  const response = await orchestrator.chat(
    'I need research on TypeScript adoption trends. Please search for information and provide a summary report.'
  )

  console.log('Response:', response.completion.content)

  const messages = orchestrator.getMessages()
  console.log(`\nTotal messages: ${messages.length}`)
}

main().catch(console.error)
