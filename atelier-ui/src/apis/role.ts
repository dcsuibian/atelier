import type { PageQuery, PageWrapper, Permission, Role, RoleQuery } from '@/types'
import request from '@/utils/http'

/**
 * 新增与编辑时提交的角色。编辑走 PATCH，字段为 undefined 表示不修改
 */
type RoleForm = Partial<Omit<Role, 'id' | 'createTime' | 'updateTime'>>

export function getRoles(params: RoleQuery & PageQuery): Promise<PageWrapper<Role>> {
  return request.get({
    url: '/roles',
    params,
  })
}

export function addRole(data: RoleForm): Promise<Role> {
  return request.post({
    url: '/roles',
    data,
  })
}

export function editRolePartially(id: number, data: RoleForm): Promise<Role> {
  return request.patch({
    url: `/roles/${id}`,
    data,
  })
}

/**
 * 删除时连同权限分配一起删。角色仍分配给用户时拒绝删除（409），以免用户的权限悄悄变少
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

export type { RoleForm }
