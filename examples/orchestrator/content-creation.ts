import { Agent, Orchestrator } from '../../src/index'

const MODEL = 'openai:gpt-4.1-nano'

async function main() {
  // Content writer for blog posts
  const blogWriter = Agent.create({
    name: 'Blog Writer',
    background:
      'You are a creative blog writer. Write engaging, SEO-friendly blog posts with compelling headlines and clear structure. Use a conversational tone and include practical examples.',
    model: MODEL,
    temperature: 0.8,
  })

  // Social media specialist
  const socialMediaExpert = Agent.create({
    name: 'Social Media Specialist',
    background:
      'You are a social media specialist. Create engaging social media posts optimized for different platforms (Twitter, LinkedIn, Instagram). Use hashtags, emojis, and platform-specific best practices.',
    model: MODEL,
    temperature: 0.9,
  })

  // SEO specialist
  const seoExpert = Agent.create({
    name: 'SEO Specialist',
    background:
      'You are an SEO specialist. Analyze content for SEO optimization, suggest keywords, meta descriptions, and provide recommendations to improve search rankings.',
    model: MODEL,
    temperature: 0.4,
  })

  // Copy editor
  const copyEditor = Agent.create({
    name: 'Copy Editor',
    background:
      "You are a professional copy editor. Review content for grammar, clarity, tone, and style. Provide constructive feedback and suggest improvements while maintaining the author's voice.",
    model: MODEL,
    temperature: 0.3,
  })

  // Content director orchestrates the team
  const contentDirector = Orchestrator.create({
    name: 'Content Director',
    background:
      'You are a content director managing a content creation team. Route blog writing to the Blog Writer, social media content to the Social Media Specialist, SEO analysis to the SEO Specialist, and editing to the Copy Editor. Coordinate the team to produce high-quality content.',
    model: MODEL,
    handoffs: [blogWriter, socialMediaExpert, seoExpert, copyEditor],
    temperature: 0.6,
  })

  console.log('=== Content Creation Team Demo ===\n')

  console.log('Request 1: Blog Post')
  console.log(
    'User: Write a very short blog post about the benefits of TypeScript for modern web development.\n'
  )
  const response1 = await contentDirector.chat(
    'Write a blog post about the benefits of TypeScript for modern web development.'
  )
  console.log('Response:', response1.completion.content)

  console.log('\n\nRequest 2: Social Media')
  console.log('User: Create a LinkedIn post promoting this blog article.\n')
  const response2 = await contentDirector.chat(
    'Create a LinkedIn post promoting this blog article about TypeScript benefits.'
  )
  console.log('Response:', response2.completion.content)

  console.log('\n\nRequest 3: SEO Review')
  console.log('User: Can you review the SEO of the blog post?\n')
  const response3 = await contentDirector.chat(
    'Can you review the SEO of the blog post and suggest improvements?'
  )
  console.log('Response:', response3.completion.content)

  const messages = contentDirector.getMessages()
  console.log(`\n\nTotal conversation messages: ${messages.length}`)
  console.log(JSON.stringify(messages, null, 3))
}

main().catch(console.error)
