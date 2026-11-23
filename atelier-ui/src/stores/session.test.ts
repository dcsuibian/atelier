import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session, User } from '@/types'
import { getSession } from '@/apis/session'
import { getAvailablePermissionsByUserId } from '@/apis/user'
import { useSessionStore } from './session'

// 只测会话加载的编排，路由、菜单、设置这些依赖浏览器环境的协作方都替换掉
vi.mock('@/apis/session', () => ({ getSession: vi.fn(), login: vi.fn(), logout: vi.fn() }))
vi.mock('@/apis/user', () => ({ getAvailablePermissionsByUserId: vi.fn() }))
vi.mock('@/router', () => ({ router: {} }))
vi.mock('@/router/guards/route-registry', () => ({ DynamicRouteRegistry: { getInstance: () => null } }))
vi.mock('@/stores/menu', () => ({ useMenuStore: () => ({}) }))
vi.mock('@/stores/setting', () => ({ useSettingStore: () => ({}) }))

const user = { id: 1, name: 'admin' } as User

/** 返回一个手动决定何时完成的 Promise，用来模拟慢请求 */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('sessionStore.ensureLoaded', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSession).mockReset()
    vi.mocked(getAvailablePermissionsByUserId).mockReset().mockResolvedValue([])
  })

  it('并发调用共用同一个请求', async () => {
    const request = deferred<Session>()
    vi.mocked(getSession).mockReturnValue(request.promise)
    const store = useSessionStore()

    const first = store.ensureLoaded()
    const second = store.ensureLoaded()
    request.resolve({ user, loginTime: 0 })
    await Promise.all([first, second])

    expect(getSession).toHaveBeenCalledTimes(1)
    expect(store.ready).toBe(true)
    expect(store.user).toEqual(user)
  })

  it('加载过之后不再请求', async () => {
    vi.mocked(getSession).mockResolvedValue({ user, loginTime: 0 })
    const store = useSessionStore()

    await store.ensureLoaded()
    await store.ensureLoaded()

    expect(getSession).toHaveBeenCalledTimes(1)
  })

  it('请求失败后不缓存失败结果，下次调用重新请求', async () => {
    vi.mocked(getSession).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ user, loginTime: 0 })
    const store = useSessionStore()

    await expect(store.ensureLoaded()).rejects.toThrow('network')
    expect(store.ready).toBe(false)

    await store.ensureLoaded()
    expect(getSession).toHaveBeenCalledTimes(2)
    expect(store.ready).toBe(true)
  })

  it('权限请求失败时不留下有用户没权限的半截状态', async () => {
    vi.mocked(getSession).mockResolvedValue({ user, loginTime: 0 })
    vi.mocked(getAvailablePermissionsByUserId).mockRejectedValue(new Error('forbidden'))
    const store = useSessionStore()

    await expect(store.ensureLoaded()).rejects.toThrow('forbidden')
    expect(store.user).toBeNull()
    expect(store.ready).toBe(false)
  })
})
