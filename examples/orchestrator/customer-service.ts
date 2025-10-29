import { Agent, Orchestrator } from '../../src/index'

async function main() {
  const techSupportAgent = Agent.create({
    name: 'Technical Support Specialist',
    instructions:
      'You are a technical support specialist. Help users troubleshoot technical issues, provide step-by-step solutions, and explain technical concepts clearly. Focus on software, hardware, and connectivity problems.',
    model: 'openai:gpt-4.1-mini',
    temperature: 0.3,
  })

  const billingAgent = Agent.create({
    name: 'Billing Specialist',
    instructions:
      'You are a billing specialist. Help users with payment issues, subscription management, refunds, and billing inquiries. Be clear about pricing and policies.',
    model: 'openai:gpt-4.1-mini',
    temperature: 0.3,
  })

  const salesAgent = Agent.create({
    name: 'Sales Representative',
    instructions:
      'You are a sales representative. Help users understand product features, pricing plans, and make recommendations based on their needs. Be persuasive but honest.',
    model: 'openai:gpt-4.1-mini',
    temperature: 0.7,
  })

  const orchestrator = Orchestrator.create({
    name: 'Customer Service Manager',
    instructions:
      "You are a customer service manager who routes customer inquiries to the appropriate specialist. Analyze the customer's question and delegate to the right agent: Technical Support for technical issues, Billing for payment/subscription issues, or Sales for product information and purchases. Always provide a brief summary after the specialist responds.",
    model: 'openai:gpt-4.1-mini',
    handoffs: [techSupportAgent, billingAgent, salesAgent],
    temperature: 0.5,
  })

  console.log('Query 1: Technical Issue')
  console.log(
    'User: My internet connection keeps dropping every few minutes. How can I fix this?\n'
  )
  const response1 = await orchestrator.chat(
    'My internet connection keeps dropping every few minutes. How can I fix this?'
  )
  console.log('Response:', response1.completion.content)

  console.log('\n\nQuery 2: Billing Issue')
  console.log(
    'User: I was charged twice for my subscription this month. Can you help?\n'
  )
  const response2 = await orchestrator.chat(
    'I was charged twice for my subscription this month. Can you help?'
  )
  console.log('Response:', response2.completion.content)

  console.log('\n\nQuery 3: Product Information')
  console.log(
    "User: What's the difference between your Basic and Premium plans?\n"
  )
  const response3 = await orchestrator.chat(
    "What's the difference between your Basic and Premium plans?"
  )
  console.log('Response:', response3.completion.content)

  const messages = orchestrator.getMessages()
  console.log(`\nTotal messages: ${messages.length}`)
}

main().catch(console.error)
