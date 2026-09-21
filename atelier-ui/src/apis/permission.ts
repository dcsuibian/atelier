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

/**
 * 取全部权限，给角色分配权限时用。接口只有分页，权限点数量由 permissions.yml 决定、不会多，逐页取完即可
 */
export async function getAllPermissions(query: PermissionQuery = {}): Promise<Permission[]> {
  const pageSize = 100
  const permissions: Permission[] = []
  for (let pageNumber = 1; ; pageNumber++) {
    const page = await getPermissions({ ...query, pageNumber, pageSize })
    permissions.push(...page.data)
    if (0 === page.data.length || permissions.length >= page.total) {
      return permissions
    }
  }
}
