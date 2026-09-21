/**
 * 路由全局前置守卫
 *
 * 这里只做路由决策，数据加载都委托出去：会话与权限归 sessionStore（它自己保证幂等与
 * 并发去重），菜单树处理归 MenuProcessor，权限过滤与注册归 DynamicRouteRegistry
 *
 * ## 流程
 *
 * 1. 静态路由（登录页除外）直接放行
 * 2. 确认会话状态
 * 3. 已登录却停在登录页，送回首页
 * 4. 未登录，送去登录页并带上 redirect
 * 5. 动态路由尚未注册，注册后重新导航
 * 6. 根路径重定向到首页
 * 7. 放行，顺带记录工作标签页与页面标题
 *
 * @module router/guards/before-each
 */
import type { NavigationGuardReturn, RouteLocationNormalized, Router } from 'vue-router'
import NProgress from 'nprogress'
import { useSettingStore } from '@/stores/setting'
import { useSessionStore } from '@/stores/session'
import { useMenuStore } from '@/stores/menu'
import { useWorktabStore } from '@/stores/work-tab'
import { setWorktab } from '@/utils/art/navigation'
import { setPageTitle } from '@/utils/art/router'
import { loadingService } from '@/utils/art/ui'
import { RoutesAlias } from '../routes-alias'
import { staticRoutes } from '../routes/static-routes'
import { dynamicRoutes } from '../routes/dynamic-routes'
import { IframeRouteManager, MenuProcessor } from '../core'
import { DynamicRouteRegistry, filterByPermission } from './route-registry'

const menuProcessor = new MenuProcessor()

export function setupBeforeEachGuard(router: Router): void {
  const registry = DynamicRouteRegistry.getInstance(router)

  router.beforeEach(async (to: RouteLocationNormalized): Promise<NavigationGuardReturn> => {
    const settingStore = useSettingStore()
    if (settingStore.showNprogress) {
      NProgress.start()
    }

    // 只有真要等网络时才遮罩。注册完重新导航的那一轮不再满足条件，所以不会闪
    const sessionStore = useSessionStore()
    const needsLoading = !sessionStore.ready || !registry?.isRegistered()
    if (needsLoading) {
      loadingService.showLoading()
    }

    try {
      return await resolve(to, router)
    } catch (error) {
      console.error('[RouteGuard] 路由守卫处理失败', error)
      return { name: 'Exception500', replace: true }
    } finally {
      if (needsLoading) {
        loadingService.hideLoading()
      }
    }
  })
}

async function resolve(to: RouteLocationNormalized, router: Router): Promise<NavigationGuardReturn> {
  const isLoginRoute = RoutesAlias.Login === to.path

  // 1. 静态路由不依赖登录态与菜单权限。登录页除外，它要判断是否已登录
  if (!isLoginRoute && isStaticRoute(to.path)) {
    return true
  }

  // 2. 服务端才是登录态的真相源
  const sessionStore = useSessionStore()
  await sessionStore.ensureLoaded()

  // 3. 已登录就别停在登录页了
  if (sessionStore.isLoggedIn && isLoginRoute) {
    return '/'
  }

  // 4. 未登录
  if (!sessionStore.isLoggedIn) {
    return isLoginRoute ? true : { name: 'Login', query: { redirect: to.fullPath } }
  }

  // 5. 首次进入，按权限注册动态路由，再重新走一遍导航
  const registry = DynamicRouteRegistry.getInstance()
  if (!registry?.isRegistered()) {
    await registerDynamicRoutes(router)
    return to.fullPath
  }

  // 6. 根路径交给首页
  const homePath = useMenuStore().getHomePath()
  if ('/' === to.path && homePath && '/' !== homePath) {
    return { path: homePath, replace: true }
  }

  // 7. 放行。静态路由里有 404 兜底，走到这里必然已匹配
  setWorktab(to)
  setPageTitle(to)
  return true
}

/**
 * 按当前用户的权限注册动态路由，并同步菜单数据
 *
 * 先过滤权限再交给菜单处理：被筛空的目录会在 filterEmptyMenus 那步一并清掉
 */
async function registerDynamicRoutes(router: Router): Promise<void> {
  const menuList = await menuProcessor.getMenuList(filterByPermission(dynamicRoutes))
  const registry = DynamicRouteRegistry.getInstance()
  registry?.register(menuList)

  const menuStore = useMenuStore()
  menuStore.setMenuList(menuList)
  menuStore.addRemoveRouteFns(registry?.getRemoveRouteFns() ?? [])

  IframeRouteManager.getInstance().save()
  useWorktabStore().validateWorktabs(router)
}

/**
 * 判断是否为静态路由
 *
 * 404 的 catch-all 不算，否则未登录时输入任意地址都会直接落到 404，而不是跳去登录页
 */
function isStaticRoute(path: string): boolean {
  const match = (routes: readonly { name?: unknown; path: string; children?: unknown }[]): boolean =>
    routes.some(route => {
      if ('Exception404' === route.name) {
        return false
      }
      const pattern = route.path.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*')
      if (new RegExp(`^${pattern}$`).test(path)) {
        return true
      }
      const children = route.children as typeof routes | undefined
      return children?.length ? match(children) : false
    })

  return match(staticRoutes)
}
