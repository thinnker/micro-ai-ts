import { describe, it, expect } from 'vitest'
import { takeRight, cleanEmptyList } from '../../src/utils/utils'

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

describe('cleanEmptyList', () => {
  it('should remove empty strings', () => {
    expect(cleanEmptyList(['a', '', 'b', '', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('should return empty array if all strings are empty', () => {
    expect(cleanEmptyList(['', '', ''])).toEqual([])
  })

  it('should return same array if no empty strings', () => {
    expect(cleanEmptyList(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('should handle empty array', () => {
    expect(cleanEmptyList([])).toEqual([])
  })
})
