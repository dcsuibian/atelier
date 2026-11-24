import type { PageWrapper, Permission, PermissionStatus } from '@/types'
import request from '@/utils/http'

/**
 * 权限列表的查询条件，对应后端 PermissionQo
 */
interface PermissionQuery {
  status?: PermissionStatus
  /** 模糊匹配权限码、名称、描述，不区分大小写 */
  searchText?: string
}

/**
 * 权限点由后端的 permissions.yml 定义、启动时同步进库，接口只读
 */
export function getPermissions(query: PermissionQuery): Promise<Permission[]>
export function getPermissions(
  query: PermissionQuery,
  pageNumber: number,
  pageSize: number,
): Promise<PageWrapper<Permission>>
export function getPermissions(query: PermissionQuery, pageNumber?: number, pageSize?: number) {
  return request.get({
    url: '/permissions',
    params: { ...query, pageNumber, pageSize },
  })
}

export type { PermissionQuery }
