import type { AppRouteRecordRaw } from '@/utils/art/router'
import type { RouteLocationNormalized } from 'vue-router'

/**
 * 静态路由配置（不需要权限就能访问的路由）
 *
 * 属性说明：
 * isHideTab: true 表示不在标签页中显示
 *
 * 注意事项：
 * 1、path、name 不要和动态路由冲突，否则会导致路由冲突无法访问
 * 2、静态路由不管是否登录都可以访问
 */
export const staticRoutes: AppRouteRecordRaw[] = [
  // 不需要登录就能访问的路由示例
  // {
  //   path: '/welcome',
  //   name: 'WelcomeStatic',
  //   component: () => import('@/views/dashboard/console/index.vue'),
  //   meta: { title: 'menus.dashboard.title' }
  // },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/login/index.vue'),
    meta: { title: 'menus.login.title', isHideTab: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/register/index.vue'),
    meta: { title: 'menus.register.title', isHideTab: true },
  },
  {
    path: '/forget-password',
    name: 'ForgetPassword',
    component: () => import('@/views/auth/forget-password/index.vue'),
    meta: { title: 'menus.forgetPassword.title', isHideTab: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/exception/403/index.vue'),
    meta: { title: '403', isHideTab: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/exception/404/index.vue'),
    meta: { title: '404', isHideTab: true },
  },
  {
    path: '/500',
    name: 'ServerError',
    component: () => import('@/views/exception/500/index.vue'),
    meta: { title: '500', isHideTab: true },
  },
]

/** 404 的 catch-all 不算，否则未登录时输入任意地址都会直接落到 404，而不是跳去登录页 */
const STATIC_ROUTE_NAMES = new Set(staticRoutes.map(route => route.name).filter(name => 'NotFound' !== name))

/**
 * 是否落在静态路由上。看匹配到的顶层路由是谁，路径怎么匹配交给 vue-router
 */
export function isStaticRoute(to: RouteLocationNormalized): boolean {
  const rootName = to.matched[0]?.name
  return undefined !== rootName && STATIC_ROUTE_NAMES.has(rootName)
}
