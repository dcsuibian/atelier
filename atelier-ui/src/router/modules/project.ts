import type { AppRouteRecord } from '@/types/art/router'
import { PERMISSIONS } from '@/constants/permission'

export const projectRoutes: AppRouteRecord = {
  path: '/project',
  name: 'ProjectRoot',
  component: () => import('@/components/app-layout/index.vue'),
  meta: {
    title: 'menus.project.title',
    icon: 'ri:folder-2-line',
  },
  children: [
    {
      path: 'list',
      name: 'Project',
      component: () => import('@/views/project/index.vue'),
      meta: {
        title: 'menus.project.list',
        icon: 'ri:folder-line',
        keepAlive: true,
        permission: PERMISSIONS.PROJECT_VIEW,
      },
    },
  ],
}
