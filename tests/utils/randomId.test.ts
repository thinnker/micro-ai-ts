import { describe, it, expect } from 'vitest'
import { randomId } from '../../src/utils/utils'

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
