import type { AppRouteRecord } from '@/types/art/router'
import { dashboardRoutes } from './modules/dashboard'
import { projectRoutes } from './modules/project'
import { systemRoutes } from './modules/system'
import { resultRoutes } from './modules/result'
import { exceptionRoutes } from './modules/exception'

/**
 * 动态路由：按权限筛选后才注册，同时用来渲染菜单。顺序就是菜单的顺序
 */
export const dynamicRoutes: AppRouteRecord[] = [
  dashboardRoutes,
  projectRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes,
]
