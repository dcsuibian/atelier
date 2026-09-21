import type { AppRouteRecord } from '@/types/art/router'
import { PERMISSIONS } from '@/constants/permission'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:user-3-line',
    // 目录本身不设限：子项被权限筛光时，这个目录会跟着一起消失
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: '/system/user',
      meta: {
        title: 'menus.system.user',
        icon: 'ri:user-line',
        keepAlive: true,
        permission: PERMISSIONS.USER_VIEW,
      },
    },
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: 'menus.system.role',
        icon: 'ri:user-settings-line',
        keepAlive: true,
        permission: PERMISSIONS.ROLE_VIEW,
      },
    },
    {
      path: 'permission',
      name: 'Permission',
      component: '/system/permission',
      meta: {
        title: 'menus.system.permission',
        icon: 'ri:shield-keyhole-line',
        keepAlive: true,
        permission: PERMISSIONS.PERMISSION_VIEW,
      },
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: 'menus.system.userCenter',
        icon: 'ri:user-line',
        isHide: true,
        keepAlive: true,
        isHideTab: true,
        // 个人中心看的是自己，不设限
      },
    },
  ],
}
