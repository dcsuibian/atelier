/**
 * 动态路由的整理、权限过滤与注册
 *
 * 权限在「注册」这一步就落地：没有权限的路由根本不会进入路由表，
 * 于是菜单、可访问的路径、路由表三者天然同源，不需要再单独做一遍路径权限校验
 *
 * @module router/route-registry
 */
import type { Router, RouteRecordRaw } from 'vue-router'
import type { AppRouteRecord } from '@/types'
import { usePermissionStore } from '@/stores/permission'
import { formatMenuTitle } from '@/utils/art/router'

const Layout = () => import('@/components/layout/index.vue')

const isExternalLink = (path: string): boolean => path.startsWith('http://') || path.startsWith('https://')

/**
 * 去掉既不是目录、也没有页面可打开的路由（没有组件，也不是外链）
 */
function dropUnreachable(routes: AppRouteRecord[]): AppRouteRecord[] {
  return routes
    .map(route => (route.children?.length ? { ...route, children: dropUnreachable(route.children) } : route))
    .filter(route => 'children' in route || route.meta.link || route.component)
}

/**
 * 子路由的 path 写成了 / 开头，会脱离父路由的层级，菜单和面包屑都会错位。只报错提示，不拦着
 */
function warnAbsoluteChildPaths(routes: AppRouteRecord[], level = 1): void {
  for (const route of routes) {
    if (!route.children?.length) {
      continue
    }
    const parentName = String(route.name || route.path || '未知路由')
    for (const child of route.children) {
      const path = child.path || ''
      if (!path.startsWith('/') || isExternalLink(path)) {
        continue
      }
      const routeName = String(child.name || path)
      console.error(
        `[路由配置错误] 菜单 "${formatMenuTitle(child.meta.title || routeName)}" (name: ${routeName}, path: ${path}) 配置错误\n` +
          `  位置: ${parentName} > ${routeName}\n` +
          `  问题: ${level + 1}级菜单的 path 不能以 / 开头\n` +
          `  应该改为: path: '${path.split('/').pop() || path.slice(1)}'`,
      )
    }
    warnAbsoluteChildPaths(route.children, level + 1)
  }
}

function joinPath(path: string, parentPath: string): string {
  if (!path) {
    return ''
  }
  if (isExternalLink(path) || path.startsWith('/')) {
    return path
  }
  return parentPath ? `${parentPath.replace(/\/$/, '')}/${path}` : `/${path}`
}

/** 目录默认跳到的页面：子树里第一个能打开的页面 */
function firstPagePath(children?: AppRouteRecord[]): string | undefined {
  for (const child of children ?? []) {
    if (child.path && '/' !== child.path && !child.meta.link && child.component) {
      return child.path
    }
    const nested = firstPagePath(child.children)
    if (nested) {
      return nested
    }
  }
  return undefined
}

/**
 * 相对路径补全成完整路径，目录没写 redirect 的补上默认跳转。菜单跳转、注册路由都用补全后的路径
 */
function resolvePaths(routes: AppRouteRecord[], parentPath = ''): AppRouteRecord[] {
  return routes.map(route => {
    const path = joinPath(route.path || '', parentPath)
    const children = route.children?.length ? resolvePaths(route.children, path) : route.children
    return { ...route, path, redirect: route.redirect || firstPagePath(children), children }
  })
}

/**
 * 把路由配置整理成要注册、也用来渲染菜单的那棵树。返回新对象，不改路由配置本身
 */
export function normalizeRoutes(routes: AppRouteRecord[]): AppRouteRecord[] {
  const reachable = dropUnreachable(routes)
  warnAbsoluteChildPaths(reachable)
  return resolvePaths(reachable)
}

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
      component: Layout,
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
 * 记录注册了哪些动态路由，以便会话变化时整批撤掉。由 setupRouter 创建，传给用到它的守卫与同步逻辑
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
