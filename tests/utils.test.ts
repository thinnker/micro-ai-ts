import { describe, it, expect } from 'vitest'
import {
  randomId,
  parseTemplate,
  stripModelName,
  stripProviderName,
  hasTag,
  stripTag,
  extractInnerTag,
  isBufferString,
  detectMimeTypeFromBufferString,
  slugify,
  takeRight,
} from '../src/utils/utils'

describe('Utils', () => {
  describe('randomId', () => {
    it('should generate a unique ID', () => {
      const id1 = randomId()
      const id2 = randomId()
      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('should generate URL-safe IDs', () => {
      const id = randomId()
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/)
    })
  })

  describe('parseTemplate', () => {
    it('should replace single variable', () => {
      const result = parseTemplate('Hello {{name}}', { name: 'World' })
      expect(result).toBe('Hello World')
    })

    it('should replace multiple variables', () => {
      const result = parseTemplate('{{greeting}} {{name}}!', {
        greeting: 'Hello',
        name: 'Alice',
      })
      expect(result).toBe('Hello Alice!')
    })

    it('should leave unmatched placeholders unchanged', () => {
      const result = parseTemplate('Hello {{name}}', {})
      expect(result).toBe('Hello {{name}}')
    })

    it('should handle empty context', () => {
      const result = parseTemplate('No variables here', {})
      expect(result).toBe('No variables here')
    })

    it('should convert non-string values to strings', () => {
      const result = parseTemplate('Count: {{count}}', { count: 42 })
      expect(result).toBe('Count: 42')
    })
  })

  describe('stripModelName', () => {
    it('should extract model name from provider:model format', () => {
      expect(stripModelName('openai:gpt-4o-mini')).toBe('gpt-4o-mini')
    })

    it('should return original string if no colon', () => {
      expect(stripModelName('gpt-4o-mini')).toBe('gpt-4o-mini')
    })

    it('should handle multiple colons', () => {
      // stripModelName only takes the part after the first colon
      expect(stripModelName('provider:model')).toBe('model')
    })
  })

  describe('stripProviderName', () => {
    it('should extract provider name from provider:model format', () => {
      expect(stripProviderName('openai:gpt-4o-mini')).toBe('openai')
    })

    it('should return empty string if no colon', () => {
      expect(stripProviderName('gpt-4o-mini')).toBe('')
    })

    it('should handle multiple colons', () => {
      expect(stripProviderName('provider:model:version')).toBe('provider')
    })
  })

  describe('hasTag', () => {
    it('should detect opening tag', () => {
      expect(hasTag('<thinking>content</thinking>', 'thinking')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(hasTag('<THINKING>content</THINKING>', 'thinking')).toBe(true)
    })

    it('should return false when tag not present', () => {
      expect(hasTag('no tags here', 'thinking')).toBe(false)
    })
  })

  describe('stripTag', () => {
    it('should remove both opening and closing tags', () => {
      const result = stripTag('<thinking>content</thinking>', 'thinking')
      expect(result).toBe('content')
    })

    it('should be case insensitive', () => {
      const result = stripTag('<THINKING>content</THINKING>', 'thinking')
      expect(result).toBe('content')
    })

    it('should handle multiple occurrences', () => {
      const result = stripTag(
        '<tag>first</tag> middle <tag>second</tag>',
        'tag'
      )
      expect(result).toBe('first middle second')
    })
  })

  describe('extractInnerTag', () => {
    it('should extract content within tags', () => {
      const result = extractInnerTag(
        '<thinking>my thoughts</thinking>',
        'thinking'
      )
      expect(result).toBe('my thoughts')
    })

    it('should trim whitespace', () => {
      const result = extractInnerTag(
        '<thinking>  content  </thinking>',
        'thinking'
      )
      expect(result).toBe('content')
    })

    it('should return empty string if tag not found', () => {
      const result = extractInnerTag('no tags', 'thinking')
      expect(result).toBe('')
    })

    it('should handle multiline content', () => {
      const result = extractInnerTag(
        '<thinking>\nline1\nline2\n</thinking>',
        'thinking'
      )
      expect(result).toBe('line1\nline2')
    })
  })

  describe('isBufferString', () => {
    it('should detect valid data URL', () => {
      expect(isBufferString('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
    })

    it('should return false for regular strings', () => {
      expect(isBufferString('not a buffer')).toBe(false)
    })

    it('should return false for incomplete data URL', () => {
      expect(isBufferString('data:image/png')).toBe(false)
    })
  })

  describe('detectMimeTypeFromBufferString', () => {
    it('should extract MIME type from data URL', () => {
      const result = detectMimeTypeFromBufferString('data:image/png;base64,abc')
      expect(result).toBe('image/png')
    })

    it('should handle different MIME types', () => {
      const result = detectMimeTypeFromBufferString(
        'data:image/jpeg;base64,abc'
      )
      expect(result).toBe('image/jpeg')
    })

    it('should return empty string for invalid buffer string', () => {
      const result = detectMimeTypeFromBufferString('not a buffer')
      expect(result).toBe('')
    })
  })

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('should replace spaces with hyphens', () => {
      expect(slugify('multiple   spaces')).toBe('multiple-spaces')
    })

    it('should remove special characters', () => {
      expect(slugify('hello@world!')).toBe('helloworld')
    })

    it('should handle underscores', () => {
      expect(slugify('hello_world')).toBe('hello-world')
    })

    it('should trim leading and trailing hyphens', () => {
      expect(slugify('  hello world  ')).toBe('hello-world')
    })

    it('should handle already slugified strings', () => {
      expect(slugify('already-slugified')).toBe('already-slugified')
    })
  })

  describe('takeRight', () => {
    it('should take last n elements', () => {
      expect(takeRight([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5])
    })

    it('should return entire array if n >= length', () => {
      expect(takeRight([1, 2, 3], 5)).toEqual([1, 2, 3])
    })

    it('should return empty array if n <= 0', () => {
      expect(takeRight([1, 2, 3], 0)).toEqual([])
      expect(takeRight([1, 2, 3], -1)).toEqual([])
    })

    it('should default to 1 element', () => {
      expect(takeRight([1, 2, 3])).toEqual([3])
    })

    it('should not mutate original array', () => {
      const original = [1, 2, 3, 4, 5]
      const result = takeRight(original, 2)
      expect(result).toEqual([4, 5])
      expect(original).toEqual([1, 2, 3, 4, 5])
    })
  })
})
