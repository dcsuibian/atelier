import type { AppRouteRecord } from '@/types'

export const exceptionRoutes: AppRouteRecord = {
  path: '/exception',
  name: 'Exception',
  component: () => import('@/components/app-layout/index.vue'),
  meta: {
    title: 'menus.exception.title',
    icon: 'ri:error-warning-line',
  },
  // 子路由名不能与静态路由重名：addRoute 遇到同名会先删掉已有的那条，404 兜底就会失效
  children: [
    {
      path: '403',
      name: 'ExceptionDemo403',
      component: () => import('@/views/exception/403/index.vue'),
      meta: {
        title: 'menus.exception.forbidden',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true,
      },
    },
    {
      path: '404',
      name: 'ExceptionDemo404',
      component: () => import('@/views/exception/404/index.vue'),
      meta: {
        title: 'menus.exception.notFound',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true,
      },
    },
    {
      path: '500',
      name: 'ExceptionDemo500',
      component: () => import('@/views/exception/500/index.vue'),
      meta: {
        title: 'menus.exception.serverError',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true,
      },
    },
  ],
}
