/**
 * 动态路由的权限过滤与注册
 *
 * 权限在「注册」这一步就落地：没有权限的路由根本不会进入路由表，
 * 于是菜单、可访问的路径、路由表三者天然同源，不需要再单独做一遍路径权限校验
 *
 * @module router/route-registry
 */
import type { Router, RouteRecordRaw } from 'vue-router'
import type { AppRouteRecord } from '@/types/art/router'
import { usePermissionStore } from '@/stores/permission'

const AppLayout = () => import('@/components/app-layout/index.vue')

/**
 * 标出没有子路由的一级菜单。侧栏和面包屑对它们特殊处理，注册路由时也要给它们套一层布局
 *
 * 返回新对象，不改路由配置本身
 */
export function markFirstLevel(routes: AppRouteRecord[]): AppRouteRecord[] {
  return routes.map(route =>
    !route.children?.length ? { ...route, meta: { ...route.meta, isFirstLevel: true } } : route,
  )
}

/**
 * 转成 vue-router 的路由记录。组件在配置里已是真实 import，只有一种情况要改形：
 * 没有子路由的一级菜单要套一层布局，否则页面没有侧栏和顶栏
 */
function toRouteRecord(route: AppRouteRecord, depth = 0): RouteRecordRaw {
  const { children, ...rest } = route
  const { component } = route

  if (0 === depth && !children?.length) {
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

/**
 * 记录注册了哪些动态路由，以便会话变化时整批撤掉。由 initRouter 创建，传给用到它的守卫与同步逻辑
 */
export class DynamicRouteRegistry {
  private readonly router: Router
  private removeRouteFns: (() => void)[] = []
  private registered = false

  constructor(router: Router) {
    this.router = router
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
}
