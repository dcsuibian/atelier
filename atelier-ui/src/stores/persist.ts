/**
 * 持久化数据读回时的检查。存的内容可能来自旧版本，也可能被改坏了，不能直接信
 */
import type { PiniaPluginContext } from 'pinia'

type Kind = 'null' | 'array' | 'string' | 'number' | 'boolean' | 'object' | 'other'

function kindOf(value: unknown): Kind {
  if (null === value) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  const type = typeof value
  return 'string' === type || 'number' === type || 'boolean' === type || 'object' === type ? type : 'other'
}

/**
 * 读回来的数据只保留 store 里有、且类型和默认值一致的字段，其余丢掉，那些字段就保持默认值
 *
 * 存的内容可能来自旧版本，也可能被改坏了，不能直接信。只查到第一层，更深的结构由各 store 自己在 afterHydrate 里查
 */
export function sanitize(stored: unknown, defaults: Record<string, unknown>): Record<string, unknown> {
  if ('object' !== kindOf(stored)) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(stored as Record<string, unknown>).filter(
      ([key, value]) => key in defaults && kindOf(value) === kindOf(defaults[key]),
    ),
  )
}

/**
 * 给声明了 persist 的 store 换上带检查的反序列化。必须挂在持久化插件之前：此时 store 还没读回数据，state 就是默认值
 */
export function sanitizePersistedState({ options, store: piniaStore }: PiniaPluginContext): void {
  const { persist } = options
  if (!persist || true === persist || Array.isArray(persist)) {
    return
  }
  const defaults = JSON.parse(JSON.stringify(piniaStore.$state)) as Record<string, unknown>
  persist.serializer = {
    serialize: JSON.stringify,
    // 解析失败抛出的异常由持久化插件接住，整份数据当作没存过
    deserialize: raw => sanitize(JSON.parse(raw), defaults),
  }
}
