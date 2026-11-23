import type { AppRouteRecord } from '@/types/art/router'

export const exceptionRoutes: AppRouteRecord = {
  path: '/exception',
  name: 'Exception',
  component: () => import('@/components/app-layout/index.vue'),
  meta: {
    title: 'menus.exception.title',
    icon: 'ri:error-warning-line',
  },
  children: [
    {
      path: '403',
      name: 'Exception403',
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
      name: 'Exception404',
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
      name: 'Exception500',
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
