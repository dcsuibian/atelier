import type { AppRouteRecord } from '@/types'

export const resultRoutes: AppRouteRecord = {
  path: '/result',
  name: 'Result',
  component: () => import('@/components/layout/index.vue'),
  meta: {
    title: 'menus.result.title',
    icon: 'ri:checkbox-circle-line',
  },
  children: [
    {
      path: 'success',
      name: 'ResultSuccess',
      component: () => import('@/views/result/success/index.vue'),
      meta: {
        title: 'menus.result.success',
        icon: 'ri:checkbox-circle-line',
        keepAlive: true,
      },
    },
    {
      path: 'fail',
      name: 'ResultFail',
      component: () => import('@/views/result/fail/index.vue'),
      meta: {
        title: 'menus.result.fail',
        icon: 'ri:close-circle-line',
        keepAlive: true,
      },
    },
  ],
}
