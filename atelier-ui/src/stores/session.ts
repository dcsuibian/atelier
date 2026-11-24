import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { User } from '@/types'
import { getSession, login as loginApi, logout as logoutApi } from '@/apis/session'
import { getAvailablePermissionsByUserId } from '@/apis/user'
import { $t } from '@/locales'
import { usePermissionStore } from '@/stores/permission'

/**
 * 当前会话。登录态在 Cookie 里，前端不持有凭证，所以服务端才是真相源，这里的状态只是它的副本
 *
 * 权限随会话同生共灭，所以由这里统一编排 permission store 的加载与清空，
 * 不要在别处单独去填或清它——两个 store 各自为政正是登录流程变乱的起点
 *
 * 这里只管状态，不碰路由：登出后跳登录页、权限变了重新注册路由，都由路由层订阅这里的变化去做
 */
export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(null)
  const loginTime = ref<number | null>(null)
  /** 是否已向服务端确认过会话状态。未确认时不能根据 user 为 null 就断定没登录 */
  const ready = ref(false)

  const isLoggedIn = computed(() => null !== user.value)

  /**
   * 清掉本地的会话与权限，不通知服务端。已经确认没登录，ready 保持 true，不必再问一遍服务端
   *
   * 工作标签页故意不清，免得误登出丢掉打开中的页面
   */
  function clear(): void {
    user.value = null
    loginTime.value = null
    usePermissionStore().clear()
  }

  /**
   * 落地一次会话查询的结果。已登录就把权限一并取回，让两者始终成套
   *
   * 先把要写的数据都取齐再赋值：权限请求失败时整个调用抛出，本地状态保持原样，
   * 不会留下「有 user 却没有权限」的半截状态
   */
  async function apply(nextUser: User | null, nextLoginTime: number | null): Promise<void> {
    if (null === nextUser) {
      clear()
      return
    }
    const permissions = await getAvailablePermissionsByUserId(nextUser.id)
    user.value = nextUser
    loginTime.value = nextLoginTime
    usePermissionStore().set(permissions)
  }

  async function load(): Promise<void> {
    const session = await getSession()
    await apply(session.user, session.loginTime)
    ready.value = true
  }

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

  async function login(name: string, password: string): Promise<void> {
    const session = await loginApi({ name, password })
    await apply(session.user, session.loginTime)
    ready.value = true
  }

  /**
   * 重新取回当前用户与权限。改了自己的资料、角色，或自己所在角色的权限之后调用，让变化立即生效
   */
  async function refresh(): Promise<void> {
    const session = await getSession()
    await apply(session.user, session.loginTime)
  }

  async function logout(): Promise<void> {
    try {
      await logoutApi()
    } catch (error) {
      // 登出接口失败不该卡住前端的登出：本地状态照清，服务端的会话交给它自己过期
      console.error('[Session] 登出接口调用失败', error)
    }
    clear()
  }

  /**
   * 服务端已经断定没登录（401）。本地还以为登着时提示一句，再按登出处理
   */
  async function expire(): Promise<void> {
    if (isLoggedIn.value) {
      ElMessage.error($t('httpMsg.sessionExpired'))
    }
    await logout()
  }

  return {
    user,
    loginTime,
    ready,
    isLoggedIn,
    ensureLoaded,
    login,
    logout,
    expire,
    refresh,
  }
})
