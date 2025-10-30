import { describe, it, expect } from 'vitest'
import {
  isBufferString,
  detectMimeTypeFromBufferString,
} from '../../src/utils/utils'

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
    const result = detectMimeTypeFromBufferString('data:image/jpeg;base64,abc')
    expect(result).toBe('image/jpeg')
  })

  it('should return empty string for invalid buffer string', () => {
    const result = detectMimeTypeFromBufferString('not a buffer')
    expect(result).toBe('')
  })
})
