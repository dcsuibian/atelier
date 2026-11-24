import type { PageWrapper, Permission, Role, RoleStatus } from '@/types'
import request from '@/utils/http'

/**
 * 角色列表的查询条件，对应后端 RoleQo
 */
interface RoleQo {
  status?: RoleStatus | null
  /** 模糊匹配角色名称、描述，不区分大小写 */
  searchText?: string | null
}

/**
 * 新增角色时提交的数据
 */
interface RoleAddDto {
  name: string
  /** 不传当作空串 */
  description?: string
  /** 不传默认启用 */
  status?: RoleStatus
}

/**
 * 部分更新角色时提交的数据。字段为 undefined 表示不修改
 */
type RoleEditPartiallyDto = Partial<RoleAddDto>

export function getRoles(query: RoleQo, pageNumber: number, pageSize: number): Promise<PageWrapper<Role>> {
  return request.get({
    url: '/roles',
    params: { ...query, pageNumber, pageSize },
  })
}

export function addRole(data: RoleAddDto): Promise<Role> {
  return request.post({
    url: '/roles',
    data,
  })
}

export function editRolePartially(id: number, data: RoleEditPartiallyDto): Promise<Role> {
  return request.patch({
    url: `/roles/${id}`,
    data,
  })
}

/**
 * 删除不级联：角色仍分配给用户或仍有权限时拒绝删除（409），要先解除
 */
export function deleteRoleById(id: number): Promise<void> {
  return request.delete({
    url: `/roles/${id}`,
  })
}

export function getPermissionsByRoleId(roleId: number): Promise<Permission[]> {
  return request.get({
    url: `/roles/${roleId}/permissions`,
  })
}

/**
 * 整体替换角色的权限，传空数组即清空
 */
export function setPermissionsByRoleId(roleId: number, permissionIds: number[]): Promise<void> {
  return request.put({
    url: `/roles/${roleId}/permissions`,
    data: permissionIds.map(id => ({ id })),
  })
}

export type { RoleQo, RoleAddDto, RoleEditPartiallyDto }
