import hyperid from 'hyperid'
import { Provider } from '../types'

/**
 * Generate a random ID using crypto.randomUUID
 */
export function randomId(): string {
  const id = hyperid({ urlSafe: true })
  return id()
}

/**
 * Parse template string and replace {{variable}} placeholders with context values
 * @param template - Template string with {{variable}} placeholders
 * @param context - Object containing variable values
 * @returns Parsed string with variables replaced
 */
export function parseTemplate(
  template: string,
  context: Record<string, any> = {}
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key] !== undefined ? String(context[key]) : match
  })
}

/**
 * Extract model name from "provider:model" format
 * @param modelString - Full model string (e.g., "openai:gpt-4.1-mini")
 * @returns Model name only (e.g., "gpt-4o-mini")
 */
export function stripModelName(modelString: string): string {
  const parts = modelString.split(':')
  return parts.length > 1 ? (parts[1] ?? modelString) : modelString
}

/**
 * Extract provider name from "provider:model" format
 * @param modelString - Full model string (e.g., "openai:gpt-4.1-mini")
 * @returns Provider name only (e.g., "openai")
 */
export function stripProviderName(modelString: string): string {
  const parts = modelString.split(':')
  return parts.length > 1 ? (parts[0] ?? '') : ''
}

/**
 * Check if content contains a specific XML-style tag
 * @param content - Content to check
 * @param tag - Tag name to look for
 * @returns True if tag is found
 */
export function hasTag(content: string, tag: string): boolean {
  const regex = new RegExp(`<${tag}>`, 'i')
  return regex.test(content)
}

/**
 * Remove XML-style tags from content
 * @param content - Content with tags
 * @param tag - Tag name to remove
 * @returns Content without the specified tags
 */
export function stripTag(content: string, tag: string): string {
  const openTagRegex = new RegExp(`<${tag}>`, 'gi')
  const closeTagRegex = new RegExp(`</${tag}>`, 'gi')
  return content.replace(openTagRegex, '').replace(closeTagRegex, '')
}

/**
 * Extract content within XML-style tags
 * @param content - Content with tags
 * @param tag - Tag name to extract
 * @returns Content within the tags, or empty string if not found
 */
export function extractInnerTag(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'is')
  const match = content.match(regex)
  return match && match[1] ? match[1].trim() : ''
}

/**
 * Check if a string is a base64-encoded buffer string (data URL)
 * @param str - String to check
 * @returns True if string is a buffer string
 */
export function isBufferString(str: string): boolean {
  return str.startsWith('data:') && str.includes(';base64,')
}

/**
 * Detect MIME type from a buffer string (data URL)
 * @param bufferString - Base64 buffer string
 * @returns MIME type (e.g., "image/png") or empty string if not detected
 */
export function detectMimeTypeFromBufferString(bufferString: string): string {
  if (!isBufferString(bufferString)) {
    return ''
  }

  const match = bufferString.match(/^data:([^;]+);base64,/)
  return match && match[1] ? match[1] : ''
}

/**
 * Convert a string to a URL-friendly slug
 * @param text - Text to slugify
 * @returns Slugified text (lowercase, hyphens, alphanumeric)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Get the last n elements from an array
 * @param array - Array to take elements from
 * @param n - Number of elements to take from the end
 * @returns New array with the last n elements
 */
export function takeRight<T>(array: T[], n: number = 1): T[] {
  if (n <= 0) return []
  if (n >= array.length) return [...array]
  return array.slice(-n)
}

/**
 * Remove empty strings from an array
 * @param array - Array of strings to filter
 * @returns New array with empty strings removed
 */
export function cleanEmptyList(array: string[]): string[] {
  return array.filter((item) => item !== '')
}

/**
 * Log a labeled message with a visual separator
 * @param label - Label to display above the logged content
 * @param args - Arguments to log after the label and separator
 */
export function microlog(label: string, ...args: any[]): void {
  console.log(`\n${label}`)
  console.log('='.repeat(50))
  console.log(...args)
  console.log('='.repeat(50) + '\n')
}

/**
 * Sanitize a provider object by masking sensitive API key information (in logs or CLI)
 * @param provider - Provider object without model property
 * @returns Sanitized provider object with masked API key
 */
export function sanitizeProvider(provider: Omit<Provider, 'model'>): any {
  if (!provider) return provider

  const sanitized = { ...provider }

  if (sanitized.apiKey && typeof sanitized.apiKey === 'string') {
    const key = sanitized.apiKey
    // Show first 10 chars, mask the rest except last 8 chars
    const firstCharacters = 10
    const lastCharacters = 8
    const total = firstCharacters + lastCharacters

    if (key.length > total) {
      const prefix = key.substring(0, firstCharacters)
      const suffix = key.substring(key.length - lastCharacters)
      const maskedLength = key.length - total
      sanitized.apiKey = `${prefix}${'•'.repeat(maskedLength)}${suffix}`
    } else if (key.length > firstCharacters) {
      const prefix = key.substring(0, firstCharacters)
      sanitized.apiKey = `${prefix}${'•'.repeat(key.length - firstCharacters)}`
    } else {
      sanitized.apiKey = '•'.repeat(key.length)
    }
  }

  return sanitized
}
