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
import { RouteTransformer, ComponentLoader, RouteValidator } from '@/router/core'

/**
 * 按权限筛选路由树。父节点没权限时整棵子树一并去掉；
 * 子节点被筛光的目录也会被去掉，避免菜单里留下点不开的空目录
 */
export function filterByPermission(routes: AppRouteRecord[]): AppRouteRecord[] {
  const permissionStore = usePermissionStore()

  return routes.reduce<AppRouteRecord[]>((accumulator, route) => {
    if (!permissionStore.check(route.meta.permission)) {
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
  private readonly transformer: RouteTransformer
  private readonly validator: RouteValidator
  private removeRouteFns: (() => void)[] = []
  private registered = false

  private constructor(router: Router) {
    this.router = router
    this.transformer = new RouteTransformer(new ComponentLoader())
    this.validator = new RouteValidator()
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

    // 路由配置写错（重名、组件缺失）时直接报出来，别让它静默变成点不开的菜单
    const { valid, errors } = this.validator.validate(routes)
    if (!valid) {
      throw new Error(`路由配置验证失败: ${errors.join(', ')}`)
    }

    this.removeRouteFns = routes
      .filter(route => route.name && !this.router.hasRoute(route.name))
      .map(route => this.router.addRoute(this.transformer.transform(route) as RouteRecordRaw))
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
