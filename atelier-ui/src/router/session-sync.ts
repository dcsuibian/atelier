/**
 * 会话变化时同步路由
 *
 * 依赖只朝一个方向：路由层订阅 store，store 不知道路由的存在。
 * 登出、权限变化之后路由该怎么变，都在这里决定，session store 只管状态
 *
 * @module router/session-sync
 */
import { watch } from 'vue'
import type { Router } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { usePermissionStore } from '@/stores/permission'
import { useMenuStore } from '@/stores/menu'
import { DynamicRouteRegistry } from '@/router/guards/route-registry'

/** 动态路由与菜单是按当前用户的权限注册的，用户或权限一变就得作废 */
function resetDynamicRoutes(): void {
  DynamicRouteRegistry.getInstance()?.unregister()
  useMenuStore().setMenuList([])
}

export function setupSessionSync(router: Router): void {
  const sessionStore = useSessionStore()
  const permissionStore = usePermissionStore()

  // 导航进行中时不插手：守卫正在根据最新的会话决定去哪（比如发现一个页面都没有就登出并去登录页），
  // 这时再发起一次导航会把它取消掉
  let navigating = false
  router.beforeEach(() => {
    navigating = true
  })
  router.afterEach(() => {
    navigating = false
  })
  router.onError(() => {
    navigating = false
  })

  watch(
    () => ({
      userId: sessionStore.user?.id ?? null,
      // 转成排好序的字符串再比较：Set 每次都是新对象，直接比引用分不出内容变没变
      codes: [...permissionStore.codes].sort().join(','),
    }),
    (current, previous) => {
      // 登录与首次加载：接下来的导航会经过守卫，由它按权限注册路由
      if (null === previous.userId) {
        return
      }
      if (current.userId === previous.userId && current.codes === previous.codes) {
        return
      }
      resetDynamicRoutes()
      if (navigating || 'Login' === router.currentRoute.value.name) {
        return
      }
      // 原地重新导航，交给守卫：已登出会被送去登录页并带上 redirect，权限变了会按新权限重新注册
      void router.replace(router.currentRoute.value.fullPath)
    },
  )
}
