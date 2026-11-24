/**
 * 动态路由的权限过滤与注册
 *
 * 权限在「注册」这一步就落地：没有权限的路由根本不会进入路由表，
 * 于是菜单、可访问的路径、路由表三者天然同源，不需要再单独做一遍路径权限校验
 *
 * @module router/guards/route-registry
 */
import type { Router, RouteRecordRaw } from 'vue-router'
import type { AppRouteRecord } from '@/types/art/router'
import { usePermissionStore } from '@/stores/permission'
import { IframeRouteManager } from '@/router/iframe-route-manager'

const AppLayout = () => import('@/components/app-layout/index.vue')
const Iframe = () => import('@/views/outside/Iframe.vue')

/**
 * 转成 vue-router 的路由记录。组件在配置里已是真实 import，只有两种情况要改形：
 * iframe 页面统一由 Iframe.vue 渲染；没有子路由的一级菜单要套一层布局，否则页面没有侧栏和顶栏
 */
function toRouteRecord(route: AppRouteRecord, depth = 0): RouteRecordRaw {
  const { children, ...rest } = route
  const isIframe = true === route.meta.isIframe
  if (isIframe) {
    IframeRouteManager.getInstance().add(route)
  }
  const component = isIframe ? Iframe : route.component

  if (0 === depth && (isIframe || !children?.length)) {
    if (!isIframe) {
      route.meta.isFirstLevel = true
    }
    const firstSegment = route.path.split('/').find(Boolean)
    return {
      ...rest,
      path: firstSegment ? `/${firstSegment}` : '/',
      name: '',
      component: AppLayout,
      children: [{ ...rest, component }],
    } as RouteRecordRaw
  }

  return {
    ...rest,
    component,
    ...(children?.length && { children: children.map(child => toRouteRecord(child, depth + 1)) }),
  } as RouteRecordRaw
}

/**
 * 按权限筛选路由树。父节点没权限时整棵子树一并去掉；
 * 子节点被筛光的目录也会被去掉，避免菜单里留下点不开的空目录
 */
export function filterByPermission(routes: AppRouteRecord[]): AppRouteRecord[] {
  const permissionStore = usePermissionStore()

  return routes.reduce<AppRouteRecord[]>((accumulator, route) => {
    // 没写 permission 表示不设限。check 本身不接受空值：别处漏传时宁可看不见，也不要谁都能看
    const { permission } = route.meta
    if (undefined !== permission && !permissionStore.check(permission)) {
      return accumulator
    }

    // 原本就是目录（有 children）却被筛空，说明底下一个都看不到，整个目录也就没有意义
    if (route.children?.length) {
      const children = filterByPermission(route.children)
      if (0 === children.length) {
        return accumulator
      }
      accumulator.push({ ...route, children })
      return accumulator
    }

    accumulator.push(route)
    return accumulator
  }, [])
}

export class DynamicRouteRegistry {
  private static instance: DynamicRouteRegistry | null = null

  private readonly router: Router
  private removeRouteFns: (() => void)[] = []
  private registered = false

  private constructor(router: Router) {
    this.router = router
  }

  /**
   * 守卫初始化时带 router 调一次建立实例；之后各处（如登出）不带参数取用
   *
   * 做成单例是为了让 sessionStore 能直接注销路由，而不必反过来依赖守卫模块
   */
  static getInstance(router?: Router): DynamicRouteRegistry | null {
    if (router && null === DynamicRouteRegistry.instance) {
      DynamicRouteRegistry.instance = new DynamicRouteRegistry(router)
    }
    return DynamicRouteRegistry.instance
  }

  register(routes: AppRouteRecord[]): void {
    if (this.registered) {
      return
    }

    this.removeRouteFns = routes
      .filter(route => route.name && !this.router.hasRoute(route.name))
      .map(route => this.router.addRoute(toRouteRecord(route)))
    this.registered = true
  }

  unregister(): void {
    this.removeRouteFns.forEach(remove => remove())
    this.removeRouteFns = []
    this.registered = false
  }

  isRegistered(): boolean {
    return this.registered
  }

  getRemoveRouteFns(): (() => void)[] {
    return this.removeRouteFns
  }
}
