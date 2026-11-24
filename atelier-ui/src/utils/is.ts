const toString = Object.prototype.toString

function getType(value: unknown): string {
  return toString.call(value).slice(8, -1)
}

// 基础类型判断
export const isString = (value: unknown): value is string => 'string' === typeof value
// 和 typeof 不同：排除 NaN。代价是 false 分支的收窄不严谨，NaN 也会被当成「非 number」
export const isNumber = (value: unknown): value is number => 'number' === typeof value && !Number.isNaN(value)
export const isBoolean = (value: unknown): value is boolean => 'boolean' === typeof value
export const isUndefined = (value: unknown): value is undefined => undefined === value
export const isNull = (value: unknown): value is null => null === value
export const isNullish = (value: unknown): value is null | undefined => null === value || undefined === value

// 对象类型判断
// 排除 null 和数组，typeof 'object' 做不到
export const isObject = (value: unknown): value is Record<string, unknown> => 'Object' === getType(value)
export const isArray = <T = unknown>(value: unknown): value is T[] => Array.isArray(value)
export const isFunction = (value: unknown): value is Function => 'function' === typeof value
export const isDate = (value: unknown): value is Date => 'Date' === getType(value)
export const isRegExp = (value: unknown): value is RegExp => 'RegExp' === getType(value)
export const isMap = (value: unknown): value is Map<unknown, unknown> => 'Map' === getType(value)
export const isSet = (value: unknown): value is Set<unknown> => 'Set' === getType(value)
export const isPromise = <T = unknown>(value: unknown): value is Promise<T> => 'Promise' === getType(value)

// 空值判断
export const isEmpty = (value: unknown): boolean => {
  if (isNullish(value)) return true
  if (isString(value) || isArray(value)) return 0 === value.length
  if (isMap(value) || isSet(value)) return 0 === value.size
  if (isObject(value)) return 0 === Object.keys(value).length
  return false
}

// 数值相关
export const isInteger = (value: unknown): value is number => Number.isInteger(value)
export const isPositive = (value: unknown): value is number => isNumber(value) && value > 0
export const isNegative = (value: unknown): value is number => isNumber(value) && value < 0

// 业务校验
export const isUrl = (value: string): boolean => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
export const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return 'http:' === url.protocol || 'https:' === url.protocol
  } catch {
    return false
  }
}
