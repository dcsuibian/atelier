import type { Extent, Tensor } from '@/types'

// 全部递归遍历而不用 Math.max(...arr)：展开参数在元素多到十几万时会栈溢出

function traverse(value: Tensor, visit: (x: number) => void): void {
  if ('number' === typeof value) {
    visit(value)
    return
  }
  for (const item of value) {
    traverse(item, visit)
  }
}

/** 展平为一维数组 */
export function flatten(value: Tensor): number[] {
  if ('number' === typeof value) return [value]
  return value.flatMap(flatten)
}

/** 元素级二元运算，a 与 b 须同形 */
export function elementWise<T extends Tensor>(a: T, b: T, fn: (x: number, y: number) => number): T {
  if ('number' === typeof a && 'number' === typeof b) {
    return fn(a, b) as T
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((v, i) => elementWise(v, b[i], fn)) as T
  }
  throw new Error('Shape mismatch')
}

/** 求和，空张量为 0 */
export function sum(value: Tensor): number {
  let total = 0
  traverse(value, x => (total += x))
  return total
}

/** 均值，空张量返回 fallback */
export function mean(value: Tensor, fallback = NaN): number {
  let total = 0
  let count = 0
  traverse(value, x => {
    total += x
    count++
  })
  return 0 === count ? fallback : total / count
}

/** 最小值与最大值，一次遍历；空张量得到 { min: Infinity, max: -Infinity } */
export function extent(value: Tensor): Extent {
  const result = { min: Infinity, max: -Infinity }
  traverse(value, x => {
    if (x < result.min) result.min = x
    if (x > result.max) result.max = x
  })
  return result
}

/** 最小值，空张量返回 fallback（默认与 Math.min() 一致） */
export function min(value: Tensor, fallback = Infinity): number {
  const result = extent(value).min
  return Infinity === result ? fallback : result
}

/** 最大值，空张量返回 fallback（默认与 Math.max() 一致） */
export function max(value: Tensor, fallback = -Infinity): number {
  const result = extent(value).max
  return -Infinity === result ? fallback : result
}
