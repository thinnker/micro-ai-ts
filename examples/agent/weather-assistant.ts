import { Agent, createTool } from '../../src/index'
import { z } from 'zod'
import { microlog } from '../../src/utils/utils'

const weatherTool = createTool(
  'get_weather',
  'Get the current weather for a specific location',
  z.object({
    location: z
      .string()
      .describe('The city and state, e.g. Washington, London, Tokyo, Pasadena'),
    unit: z
      .enum(['celsius', 'fahrenheit'])
      .optional()
      .describe('Temperature unit (default: fahrenheit)'),
  }),
  async ({ location, unit = 'fahrenheit' }) => {
    const weatherData: Record<string, any> = {
      Washington: { temp: 65, condition: 'Partly cloudy' },
      Tokyo: { temp: 55, condition: 'Sunny' },
      Pasadena: { temp: 45, condition: 'Clear' },
      London: { temp: 50, condition: 'Rainy' },
    }

    const data = location
      ? weatherData?.[location]
      : {
          temp: 70,
          condition: 'Unknown',
        }

    const temp =
      unit === 'celsius' ? Math.round(((data.temp - 32) * 5) / 9) : data.temp

    return {
      location,
      temperature: temp,
      unit,
      condition: data.condition,
      message: `Weather in ${location}: ${temp}°${
        unit === 'celsius' ? 'C' : 'F'
      }, ${data.condition}`,
    }
  }
)

const timeTool = createTool(
  'get_time',
  'Get the current time for a specific timezone',
  z.object({
    cityName: z
      .string()
      .describe('The city, e.g., Washington, London, Tokyo, Pasadena'),
  }),
  async ({ cityName }) => {
    const timeData: Record<string, string> = {
      Washington: '10:30 AM EST',
      London: '3:30 PM GMT',
      Tokyo: '12:30 AM JST',
      Pasadena: '7:30 AM PST',
    }

    const time = timeData[cityName] || '12:00 PM UTC'

    return {
      cityName,
      time,
      message: `Current time in ${cityName}: ${time}`,
    }
  }
)

async function main() {
  const agent = Agent.create({
    name: 'Personal Assistant',
    background:
      'You are a helpful personal assistant. Use the available tools to provide accurate information about weather and time. Always be friendly and concise.',
    goal: 'Answer the user queries and provide accurate information.',
    debug: true,
    tools: [weatherTool, timeTool],
  })

  const response = await agent.chat(
    "What's the weather like in Tokyo and what time is it there?"
  )

  microlog('Response', response.completion.content)
}

main().catch(console.error)
