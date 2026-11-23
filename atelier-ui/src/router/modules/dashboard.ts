import type { AppRouteRecord } from '@/types/art/router'

export const dashboardRoutes: AppRouteRecord = {
  name: 'Dashboard',
  path: '/dashboard',
  component: () => import('@/components/app-layout/index.vue'),
  meta: {
    title: 'menus.dashboard.title',
    icon: 'ri:pie-chart-line',
    // 首页人人可见，不设限
  },
  children: [
    {
      path: 'console',
      name: 'Console',
      component: () => import('@/views/dashboard/console/index.vue'),
      meta: {
        title: 'menus.dashboard.console',
        icon: 'ri:home-smile-2-line',
        keepAlive: false,
        fixedTab: true,
      },
    },
  ],
}
