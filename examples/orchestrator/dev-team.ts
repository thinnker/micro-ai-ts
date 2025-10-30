import { Agent, Orchestrator } from '../../src/index'

async function main() {
  const pythonExpert = Agent.create({
    name: 'Python Expert',
    background:
      'You are a Python programming expert. Help with Python code, best practices, and Python-specific questions. Remember context from previous interactions.',
    model: 'openai:gpt-4.1-mini',
    temperature: 0.4,
  })

  const javascriptExpert = Agent.create({
    name: 'JavaScript Expert',
    background:
      'You are a JavaScript/TypeScript expert. Help with JS/TS code, best practices, and JavaScript-specific questions. Remember context from previous interactions.',
    model: 'openai:gpt-4.1-mini',
    temperature: 0.4,
  })

  const architectExpert = Agent.create({
    name: 'Software Architect',
    background:
      'You are a software architect. Provide high-level design advice, architecture patterns, and system design guidance. Consider context from previous discussions.',
    model: 'openai:gpt-4.1-mini',
    temperature: 0.5,
  })

  const orchestrator = Orchestrator.create({
    name: 'Development Team Lead',
    background:
      'You are a development team lead. Route programming questions to the appropriate expert: Python Expert for Python questions, JavaScript Expert for JS/TS questions, and Software Architect for design and architecture questions. Maintain context across the conversation.',
    model: 'openai:gpt-4.1-mini',
    handoffs: [pythonExpert, javascriptExpert, architectExpert],
    temperature: 0.5,
  })

  console.log('Turn 1: Initial question')
  console.log(
    "User: I'm building a web application. Should I use Python or JavaScript for the backend?\n"
  )
  const turn1 = await orchestrator.chat(
    "I'm building a web application. Should I use Python or JavaScript for the backend?"
  )
  console.log('Response:', turn1.completion.content)

  console.log('\n\nTurn 2: Follow-up (context maintained)')
  console.log('User: What about for a real-time chat feature?\n')
  const turn2 = await orchestrator.chat(
    'What about for a real-time chat feature?'
  )
  console.log('Response:', turn2.completion.content)

  console.log('\n\nTurn 3: Specific implementation (context maintained)')
  console.log(
    'User: Can you show me a simple example in the language you recommended?\n'
  )
  const turn3 = await orchestrator.chat(
    'Can you show me a simple example in the language you recommended?'
  )
  console.log('Response:', turn3.completion.content)

  const messages = orchestrator.getMessages()
  console.log(`\nTotal messages: ${messages.length}`)
}

main().catch(console.error)
