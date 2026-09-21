import request from '@/utils/http'
import type { AppRouteRecord } from '@/types/art/router'

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/menus',
  })
}
