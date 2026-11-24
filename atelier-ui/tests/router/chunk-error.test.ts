import { describe, expect, it } from 'vitest'
import { isChunkLoadError } from '@/router/chunk-error'

describe('isChunkLoadError', () => {
  it('认得各浏览器的 chunk 加载失败', () => {
    for (const message of [
      'Failed to fetch dynamically imported module: https://example.com/assets/user-abc.js',
      'error loading dynamically imported module: https://example.com/assets/user-abc.js',
      'Importing a module script failed.',
      'Unable to preload CSS for /assets/user-abc.css',
    ]) {
      expect(isChunkLoadError(new Error(message))).toBe(true)
    }
  })

  it('其他错误不算', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false)
  })
})
