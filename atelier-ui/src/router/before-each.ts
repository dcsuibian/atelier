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
 * 7. 放行。记录工作标签页、设置页面标题是导航成功之后的事，在后置守卫里做
 *
 * @module router/before-each
 */
import { ElMessage } from 'element-plus'
import type { NavigationGuardReturn, RouteLocationNormalized, Router } from 'vue-router'
import NProgress from 'nprogress'
import { $t } from '@/locales'
import { useSettingStore } from '@/stores/setting'
import { useSessionStore } from '@/stores/session'
import { useMenuStore } from '@/stores/menu'
import { useWorkTabStore } from '@/stores/work-tab'
import { loadingService } from '@/utils/art/ui'
import { isStaticRoute } from './routes/static-routes'
import { dynamicRoutes } from './routes/dynamic-routes'
import { MenuProcessor } from './menu-processor'
import { type DynamicRouteRegistry, filterByPermission, markFirstLevel } from './route-registry'

const menuProcessor = new MenuProcessor()

export function setupBeforeEachGuard(router: Router, registry: DynamicRouteRegistry): void {
  router.beforeEach(async (to: RouteLocationNormalized): Promise<NavigationGuardReturn> => {
    const settingStore = useSettingStore()
    if (settingStore.showNprogress) {
      NProgress.start()
    }

    // 只有真要等网络时才遮罩。关闭放在 afterEach：守卫放行后还要下载懒加载的布局与页面，
    // 在这里关掉的话，这段时间屏幕会停在旧页面上
    const sessionStore = useSessionStore()
    if (!sessionStore.ready || !registry.isRegistered()) {
      loadingService.showLoading()
    }

    try {
      return await resolve(to, router, registry)
    } catch (error) {
      console.error('[RouteGuard] 路由守卫处理失败', error)
      return { name: 'ServerError', replace: true }
    }
  })
}

async function resolve(
  to: RouteLocationNormalized,
  router: Router,
  registry: DynamicRouteRegistry,
): Promise<NavigationGuardReturn> {
  const isLoginRoute = 'Login' === to.name

  // 1. 静态路由不依赖登录态与菜单权限。登录页除外，它要判断是否已登录
  if (!isLoginRoute && isStaticRoute(to)) {
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
  if (!registry.isRegistered()) {
    const registered = await registerDynamicRoutes(router, registry)
    // 一个页面都没有，再往下走只会落到 404，还不如直接说清楚
    if (0 === registered) {
      ElMessage.warning($t('session.noPagePermission'))
      await sessionStore.logout()
      return { name: 'Login' }
    }
    return to.fullPath
  }

  // 6. 根路径交给首页
  const homePath = useMenuStore().getHomePath()
  if ('/' === to.path && homePath && '/' !== homePath) {
    return { path: homePath, replace: true }
  }

  // 7. 放行
  return true
}

/**
 * 按当前用户的权限注册动态路由，并同步菜单数据
 *
 * 先过滤权限再交给菜单处理：被筛空的目录会在 filterEmptyMenus 那步一并清掉
 *
 * @returns 实际注册的顶层路由数量，为 0 表示这个账号一个页面都看不到
 */
async function registerDynamicRoutes(router: Router, registry: DynamicRouteRegistry): Promise<number> {
  const menuList = markFirstLevel(await menuProcessor.getMenuList(filterByPermission(dynamicRoutes)))
  registry.register(menuList)
  useMenuStore().setMenuList(menuList)

  useWorkTabStore().validateWorktabs(router)

  return menuList.length
}
