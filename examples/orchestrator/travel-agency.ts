import { Agent, Orchestrator, createTool } from '../../src/index'
import { z } from 'zod'

const MODEL = 'openai:gpt-4.1-mini'

// Simulated flight search tool
const flightSearchTool = createTool(
  'search_flights',
  'Search for available flights between cities',
  z.object({
    from: z.string().describe('Departure city'),
    to: z.string().describe('Destination city'),
    date: z.string().describe('Travel date (YYYY-MM-DD)'),
  }),
  async ({ from, to, date }) => {
    return {
      flights: [
        {
          airline: 'SkyAir',
          departure: '08:00',
          arrival: '12:30',
          price: 299,
          stops: 0,
        },
        {
          airline: 'CloudJet',
          departure: '14:00',
          arrival: '19:15',
          price: 249,
          stops: 1,
        },
      ],
      message: `Found 2 flights from ${from} to ${to} on ${date}`,
    }
  }
)

// Simulated hotel search tool
const hotelSearchTool = createTool(
  'search_hotels',
  'Search for available hotels in a city',
  z.object({
    city: z.string().describe('City name'),
    checkin: z.string().describe('Check-in date (YYYY-MM-DD)'),
    checkout: z.string().describe('Check-out date (YYYY-MM-DD)'),
  }),
  async ({ city, checkin, checkout }) => {
    return {
      hotels: [
        {
          name: 'Grand Plaza Hotel',
          rating: 4.5,
          price_per_night: 150,
          amenities: ['WiFi', 'Pool', 'Gym'],
        },
        {
          name: 'City Center Inn',
          rating: 4.0,
          price_per_night: 95,
          amenities: ['WiFi', 'Breakfast'],
        },
      ],
      message: `Found 2 hotels in ${city} from ${checkin} to ${checkout}`,
    }
  }
)

async function main() {
  // Flight booking specialist
  const flightAgent = Agent.create({
    name: 'Flight Booking Specialist',
    background:
      'You are a flight booking specialist. Use the search_flights tool to find flights. Help customers find the best flight options based on their preferences for price, timing, and connections.',
    model: MODEL,
    tools: [flightSearchTool],
    temperature: 0.4,
  })

  // Hotel booking specialist
  const hotelAgent = Agent.create({
    name: 'Hotel Booking Specialist',
    background:
      'You are a hotel booking specialist. Use the search_hotels tool to find accommodations. Help customers find hotels that match their budget and preferences.',
    model: MODEL,
    tools: [hotelSearchTool],
    temperature: 0.4,
  })

  // Travel advisor
  const advisorAgent = Agent.create({
    name: 'Travel Advisor',
    background:
      'You are a travel advisor. Provide destination recommendations, travel tips, visa information, and local insights. Help travelers plan memorable trips.',
    model: MODEL,
    temperature: 0.7,
  })

  // Orchestrator coordinates all travel services
  const travelOrchestrator = Orchestrator.create({
    name: 'Travel Agency Manager',
    background:
      'You are a travel agency manager coordinating travel bookings. Route flight requests to the Flight Specialist, hotel requests to the Hotel Specialist, and general travel advice to the Travel Advisor. Provide comprehensive travel planning assistance.',
    model: MODEL,
    handoffs: [flightAgent, hotelAgent, advisorAgent],
    temperature: 0.5,
  })

  console.log('=== Travel Agency Orchestrator Demo ===\n')

  console.log('Query 1: Flight Booking')
  console.log(
    'User: I need to fly from New York to London on 2024-06-15. What are my options?\n'
  )
  const response1 = await travelOrchestrator.chat(
    'I need to fly from New York to London on 2024-06-15. What are my options?'
  )
  console.log('Response:', response1.completion.content)

  console.log('\n\nQuery 2: Hotel Booking')
  console.log('User: I also need a hotel in London from June 15 to June 20.\n')
  const response2 = await travelOrchestrator.chat(
    'I also need a hotel in London from June 15 to June 20.'
  )
  console.log('Response:', response2.completion.content)

  console.log('\n\nQuery 3: Travel Advice')
  console.log('User: What are the must-see attractions in London?\n')
  const response3 = await travelOrchestrator.chat(
    'What are the must-see attractions in London?'
  )
  console.log('Response:', response3.completion.content)

  const messages = travelOrchestrator.getMessages()
  console.log(`\n\nTotal conversation messages: ${messages.length}`)
}

main().catch(console.error)
