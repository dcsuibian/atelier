import { describe, expect, it } from 'vitest'
import { isEmpty, isHttpUrl, isNullish, isNumber, isObject, isPositive } from '@/utils/is'

describe('isNumber', () => {
  it('排除 NaN', () => {
    expect(isNumber(1)).toBe(true)
    expect(isNumber(NaN)).toBe(false)
  })

  it('数字字符串不算', () => {
    expect(isNumber('1')).toBe(false)
  })
})

describe('isNullish', () => {
  it('只认 null 与 undefined', () => {
    expect(isNullish(null)).toBe(true)
    expect(isNullish(undefined)).toBe(true)
    expect(isNullish(0)).toBe(false)
    expect(isNullish('')).toBe(false)
  })
})

describe('isObject', () => {
  it('排除 null 与数组', () => {
    expect(isObject({})).toBe(true)
    expect(isObject(null)).toBe(false)
    expect(isObject([])).toBe(false)
  })
})

describe('isEmpty', () => {
  it('各种容器为空时为 true', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty({})).toBe(true)
    expect(isEmpty(new Map())).toBe(true)
    expect(isEmpty(new Set())).toBe(true)
  })

  it('0、false 与空白字符串不算空', () => {
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(false)).toBe(false)
    expect(isEmpty(' ')).toBe(false)
  })
})

describe('isPositive', () => {
  it('不含 0', () => {
    expect(isPositive(1)).toBe(true)
    expect(isPositive(0)).toBe(false)
  })
})

describe('isHttpUrl', () => {
  it('只认 http 与 https', () => {
    expect(isHttpUrl('https://example.com')).toBe(true)
    expect(isHttpUrl('mailto:a@example.com')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
  })
})
