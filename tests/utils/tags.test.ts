import { describe, it, expect } from 'vitest'
import { hasTag, stripTag, extractInnerTag } from '../../src/utils/utils'

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
    const result = stripTag('<tag>first</tag> middle <tag>second</tag>', 'tag')
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
