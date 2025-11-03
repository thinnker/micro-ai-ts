import { describe, it, expect } from 'vitest'
import { slugify } from '../../src/utils/utils'

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello_world')
  })

  it('should replace spaces with hyphens', () => {
    expect(slugify('multiple   spaces')).toBe('multiple_spaces')
  })

  it('should remove special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld')
  })

  it('should handle underscores', () => {
    expect(slugify('hello_world')).toBe('hello_world')
  })

  it('should trim leading and trailing hyphens', () => {
    expect(slugify('  hello world  ')).toBe('hello_world')
  })

  it('should handle already slugified strings', () => {
    expect(slugify('already-slugified')).toBe('already_slugified')
  })
})
