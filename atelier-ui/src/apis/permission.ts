import type { PageQuery, PageWrapper, Permission, PermissionQuery } from '@/types'
import request from '@/utils/http'

/**
 * 权限点由后端的 permissions.yml 定义、启动时同步进库，接口只读
 */
export function getPermissions(params: PermissionQuery & PageQuery): Promise<PageWrapper<Permission>> {
  return request.get({
    url: '/permissions',
    params,
  })
}
