import type { Provider } from './types'

/**
 * Create a provider configuration object
 * Separates the model from the provider config for internal use
 */
export function createProvider(config: Provider): {
  provider: Omit<Provider, 'model'>
  model: string
} {
  const { model, ...provider } = config
  return { provider, model }
}

/**
 * Built-in provider configurations
 * Each provider includes API endpoint, authentication, and default model
 */
export const Providers = {
  openai: (model = 'gpt-4.1-mini'): Provider => ({
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model,
  }),

  groq: (model = 'llama-3.3-70b-versatile'): Provider => ({
    apiKey: process.env.GROQ_API_KEY || '',
    baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    model,
  }),

  gemini: (model = 'gemini-2.5-flash-lite'): Provider => ({
    apiKey: process.env.GEMINI_API_KEY || '',
    baseURL:
      process.env.GEMINI_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta/openai',
    model,
  }),

  ai302: (model = 'gpt-4.1-mini'): Provider => ({
    apiKey: process.env.AI_302_API_KEY || '',
    baseURL: process.env.AI_302_BASE_URL || 'https://api.302.ai/v1',
    model,
  }),

  openrouter: (model = 'openai/gpt-4.1-mini'): Provider => ({
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    model,
  }),

  deepseek: (model = 'deepseek-chat'): Provider => ({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    model,
  }),

  grok: (model = 'grok-4-fast'): Provider => ({
    apiKey: process.env.GROK_API_KEY || '',
    baseURL: process.env.GROK_BASE_URL || 'https://api.x.ai/v1',
    model,
  }),

  fireworks: (
    model = 'accounts/fireworks/models/llama4-maverick-instruct-basic'
  ): Provider => ({
    apiKey: process.env.FIREWORKS_API_KEY || '',
    baseURL:
      process.env.FIREWORKS_BASE_URL || 'https://api.fireworks.ai/inference/v1',
    model,
  }),

  mistral: (model = 'mistral-large-latest'): Provider => ({
    apiKey: process.env.MISTRAL_API_KEY || '',
    baseURL: process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
    model,
  }),

  together: (
    model = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
  ): Provider => ({
    apiKey: process.env.TOGETHER_API_KEY || '',
    baseURL: process.env.TOGETHER_BASE_URL || 'https://api.together.xyz/v1',
    model,
  }),
}
