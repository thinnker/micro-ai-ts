import { Agent, Orchestrator } from '../../src/index'

const MODEL = 'openai:gpt-4.1-nano'

async function main() {
  // General practitioner
  const generalPractitioner = Agent.create({
    name: 'General Practitioner',
    background:
      'You are a general practitioner. Provide general health advice, assess common symptoms, and recommend when to seek specialist care. Always remind users to consult healthcare professionals for serious concerns.',
    model: MODEL,
    temperature: 0.3,
  })

  // Mental health counselor
  const mentalHealthCounselor = Agent.create({
    name: 'Mental Health Counselor',
    background:
      'You are a mental health counselor. Provide supportive guidance for stress, anxiety, and mental wellness. Offer coping strategies and recommend professional help when needed. Be empathetic and non-judgmental.',
    model: MODEL,
    temperature: 0.5,
  })

  // Nutritionist
  const nutritionist = Agent.create({
    name: 'Nutritionist',
    background:
      'You are a certified nutritionist. Provide dietary advice, meal planning suggestions, and nutritional information. Help people make healthier food choices based on their goals and restrictions.',
    model: MODEL,
    temperature: 0.4,
  })

  // Fitness coach
  const fitnessCoach = Agent.create({
    name: 'Fitness Coach',
    background:
      'You are a fitness coach. Provide exercise recommendations, workout plans, and fitness advice. Tailor suggestions to different fitness levels and goals. Emphasize safety and proper form.',
    model: MODEL,
    temperature: 0.5,
  })

  // Healthcare triage orchestrator
  const healthcareOrchestrator = Orchestrator.create({
    name: 'Healthcare Triage Coordinator',
    background:
      'You are a healthcare triage coordinator. Route health questions to the appropriate specialist: General Practitioner for medical symptoms, Mental Health Counselor for emotional/psychological concerns, Nutritionist for diet questions, and Fitness Coach for exercise advice. Always include a disclaimer that this is informational only and not a substitute for professional medical advice.',
    model: MODEL,
    handoffs: [
      generalPractitioner,
      mentalHealthCounselor,
      nutritionist,
      fitnessCoach,
    ],
    temperature: 0.4,
  })

  console.log('=== Healthcare Triage System Demo ===\n')
  console.log(
    'DISCLAIMER: This is a demonstration only. Always consult qualified healthcare professionals.\n'
  )

  console.log('Query 1: General Health')
  console.log(
    'User: I have been experiencing headaches for the past few days. What could be causing this?\n'
  )
  const response1 = await healthcareOrchestrator.chat(
    'I have been experiencing headaches for the past few days. What could be causing this?'
  )
  console.log('Response:', response1.completion.content)

  console.log('\n\nQuery 2: Mental Health')
  console.log(
    'User: I have been feeling stressed and anxious about work lately. Any advice?\n'
  )
  const response2 = await healthcareOrchestrator.chat(
    'I have been feeling stressed and anxious about work lately. Any advice?'
  )
  console.log('Response:', response2.completion.content)

  console.log('\n\nQuery 3: Nutrition')
  console.log(
    'User: What should I eat to boost my energy levels throughout the day?\n'
  )
  const response3 = await healthcareOrchestrator.chat(
    'What should I eat to boost my energy levels throughout the day?'
  )
  console.log('Response:', response3.completion.content)

  console.log('\n\nQuery 4: Fitness')
  console.log(
    'User: I want to start exercising. What routine do you suggest?\n'
  )
  const response4 = await healthcareOrchestrator.chat(
    'I want to start exercising but I am a complete beginner. What routine do you suggest?'
  )
  console.log('Response:', response4.completion.content)

  const messages = healthcareOrchestrator.getMessages()
  console.log(`\n\nTotal conversation messages: ${messages.length}`)
}

main().catch(console.error)
