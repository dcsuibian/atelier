import type { User } from '@/types'
import { getSession, login as loginApi, logout as logoutApi } from '@/apis/session'
import { getAvailablePermissionsByUserId } from '@/apis/user'
import { usePermissionStore } from '@/stores/permission'
import { router } from '@/router'

/**
 * 当前会话。登录态在 Cookie 里，前端不持有凭证，所以服务端才是真相源，这里的状态只是它的副本
 *
 * 权限随会话同生共灭，所以由这里统一编排 permission store 的加载与清空，
 * 不要在别处单独去填或清它——两个 store 各自为政正是登录流程变乱的起点
 */
export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(null)
  const loginTime = ref<number | null>(null)
  /** 是否已向服务端确认过会话状态。未确认时不能根据 user 为 null 就断定没登录 */
  const ready = ref(false)

  const isLoggedIn = computed(() => null !== user.value)

  // 进行中的加载请求。并发导航共用同一个 Promise，避免重复打后端
  let pending: Promise<void> | null = null

  /**
   * 确保会话状态已从服务端取回，幂等。守卫在每次导航前调用
   */
  function ensureLoaded(): Promise<void> {
    if (ready.value) {
      return Promise.resolve()
    }
    pending ??= load().finally(() => {
      pending = null
    })
    return pending
  }

  async function load(): Promise<void> {
    const session = await getSession()
    await apply(session.user, session.loginTime)
    ready.value = true
  }

  async function login(name: string, password: string): Promise<void> {
    const session = await loginApi({ name, password })
    await apply(session.user, session.loginTime)
    ready.value = true
  }

  /**
   * @param toLogin 是否跳转到登录页，并带上当前地址作为 redirect
   */
  async function logout(toLogin = true): Promise<void> {
    try {
      await logoutApi()
    } catch (error) {
      // 登出接口失败不该卡住前端的登出：本地状态照清，服务端的会话交给它自己过期
      console.error('[Session] 登出接口调用失败', error)
    }
    reset()
    if (toLogin) {
      const { fullPath, name } = router.currentRoute.value
      await router.push({
        name: 'Login',
        query: 'Login' === name ? undefined : { redirect: fullPath },
      })
    }
  }

  /**
   * 落地一次会话查询的结果。已登录就把权限一并取回，让两者始终成套
   *
   * 先把要写的数据都取齐再赋值：权限请求失败时整个调用抛出，本地状态保持原样，
   * 不会留下「有 user 却没有权限」的半截状态
   */
  async function apply(nextUser: User | null, nextLoginTime: number | null): Promise<void> {
    const permissionStore = usePermissionStore()
    if (null === nextUser) {
      user.value = null
      loginTime.value = null
      permissionStore.clear()
      return
    }
    const permissions = await getAvailablePermissionsByUserId(nextUser.id)
    user.value = nextUser
    loginTime.value = nextLoginTime
    permissionStore.set(permissions)
  }

  /**
   * 清空本地状态，回到「未向服务端确认过」的初始态
   */
  function reset(): void {
    user.value = null
    loginTime.value = null
    ready.value = false
    usePermissionStore().clear()
  }

  return {
    user,
    loginTime,
    ready,
    isLoggedIn,
    ensureLoaded,
    login,
    logout,
    reset,
  }
})
