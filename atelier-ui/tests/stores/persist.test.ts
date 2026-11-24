import { describe, expect, it } from 'vitest'
import { sanitize } from '@/stores/persist'

const defaults = { language: 'zh-CN', menuOpen: true, width: 230, history: [], current: {}, owner: null }

describe('sanitize', () => {
  it('类型与默认值一致的字段保留', () => {
    const stored = { language: 'en-US', menuOpen: false, width: 200, history: [1], current: { path: '/a' } }
    expect(sanitize(stored, defaults)).toEqual(stored)
  })

  it('类型对不上的字段丢掉，留给默认值', () => {
    expect(sanitize({ menuOpen: 'false', width: '200', history: {}, current: [] }, defaults)).toEqual({})
  })

  it('store 里没有的字段丢掉', () => {
    expect(sanitize({ removedLongAgo: 1, language: 'en-US' }, defaults)).toEqual({ language: 'en-US' })
  })

  it('存的不是对象就整份丢掉', () => {
    expect(sanitize('oops', defaults)).toEqual({})
    expect(sanitize(null, defaults)).toEqual({})
    expect(sanitize([1, 2], defaults)).toEqual({})
  })
})
