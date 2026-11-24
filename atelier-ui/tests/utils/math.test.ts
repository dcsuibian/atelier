import { describe, expect, it } from 'vitest'
import { elementWise, extent, flatten, max, mean, min, sum } from '@/utils/math'

const matrix = [
  [1, 2],
  [3, -4],
]

describe('flatten', () => {
  it('任意维度展平为一维', () => {
    expect(flatten(5)).toEqual([5])
    expect(flatten([1, [2, [3]]])).toEqual([1, 2, 3])
  })
})

describe('elementWise', () => {
  it('按位置逐元素运算，不改原数组', () => {
    const b = [
      [10, 20],
      [30, 40],
    ]
    expect(elementWise(matrix, b, (x, y) => x + y)).toEqual([
      [11, 22],
      [33, 36],
    ])
    expect(matrix).toEqual([
      [1, 2],
      [3, -4],
    ])
  })

  it('形状不一致时报错', () => {
    expect(() => elementWise<number | number[]>(1, [1], (x, y) => x + y)).toThrow('Shape mismatch')
  })
})

describe('sum 与 mean', () => {
  it('对任意维度求和、求均值', () => {
    expect(sum(matrix)).toBe(2)
    expect(mean(matrix)).toBe(0.5)
  })

  it('空数据：sum 为 0，mean 默认 NaN，可指定 fallback', () => {
    expect(sum([])).toBe(0)
    expect(mean([])).toBeNaN()
    expect(mean([], 0)).toBe(0)
  })
})

describe('extent、min、max', () => {
  it('取最小值与最大值', () => {
    expect(extent(matrix)).toEqual({ min: -4, max: 3 })
    expect(min(matrix)).toBe(-4)
    expect(max(matrix)).toBe(3)
  })

  it('空数据默认与 Math.min()、Math.max() 一致，可指定 fallback', () => {
    expect(min([])).toBe(Infinity)
    expect(max([])).toBe(-Infinity)
    expect(max([], 0)).toBe(0)
  })

  it('大数组不会栈溢出', () => {
    const big = Array.from({ length: 1_000_000 }, (_, i) => i)
    expect(() => Math.max(...big)).toThrow(RangeError)
    expect(max(big)).toBe(999_999)
  })
})
