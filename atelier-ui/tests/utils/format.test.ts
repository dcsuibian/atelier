import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatTime } from '@/utils/format'

// 按本地时区构造，测试结果不受运行环境的时区影响
const time = new Date(2026, 0, 2, 3, 4, 5).getTime()

describe('format', () => {
  it('按固定格式输出', () => {
    expect(formatDateTime(time)).toBe('2026-01-02 03:04:05')
    expect(formatDate(time)).toBe('2026-01-02')
    expect(formatTime(time)).toBe('03:04:05')
  })

  it('空值显示占位符', () => {
    for (const format of [formatDateTime, formatDate, formatTime]) {
      expect(format(null)).toBe('-')
      expect(format(undefined)).toBe('-')
    }
  })

  it('0 是合法的时间戳，不当作空值', () => {
    expect(formatDate(0)).not.toBe('-')
  })
})
