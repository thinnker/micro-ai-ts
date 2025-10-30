import { describe, it, expect, vi } from 'vitest'
import { microlog } from '../../src/utils/utils'

describe('microlog', () => {
  it('should log with label and separator', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    microlog('Test Label', 'content')
    expect(consoleSpy).toHaveBeenCalledWith('\nTest Label')
    expect(consoleSpy).toHaveBeenCalledWith('='.repeat(50))
    expect(consoleSpy).toHaveBeenCalledWith('content')
    consoleSpy.mockRestore()
  })

  it('should handle multiple arguments', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    microlog('Multi', 'arg1', 'arg2', 'arg3')
    expect(consoleSpy).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    consoleSpy.mockRestore()
  })
})
