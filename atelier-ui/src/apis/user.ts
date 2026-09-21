import type { PageQuery, PageWrapper, Permission, Role, User, UserQuery } from '@/types'
import request from '@/utils/http'

/**
 * 新增与编辑时提交的用户。password 只进不出，响应里的 User 没有这个字段
 *
 * 编辑走 PATCH，字段为 undefined 表示不修改——所以可空字段一旦有值就清不回空
 */
type UserForm = Partial<Omit<User, 'id' | 'createTime' | 'updateTime'> & { password: string }>

export function getUsers(params: UserQuery & PageQuery): Promise<PageWrapper<User>> {
  return request.get({
    url: '/users',
    params,
  })
}

export function getUserById(id: number): Promise<User> {
  return request.get({
    url: `/users/${id}`,
  })
}

export function addUser(data: UserForm): Promise<User> {
  return request.post({
    url: '/users',
    data,
  })
}

export function editUserPartially(id: number, data: UserForm): Promise<User> {
  return request.patch({
    url: `/users/${id}`,
    data,
  })
}

/**
 * 删除时连同角色分配一起删。超级管理员不能删除
 */
export function deleteUserById(id: number): Promise<void> {
  return request.delete({
    url: `/users/${id}`,
  })
}

export function getRolesByUserId(userId: number): Promise<Role[]> {
  return request.get({
    url: `/users/${userId}/roles`,
  })
}

/**
 * 整体替换用户的角色，传空数组即清空
 */
export function setRolesByUserId(userId: number, roleIds: number[]): Promise<void> {
  return request.put({
    url: `/users/${userId}/roles`,
    data: roleIds.map(id => ({ id })),
  })
}

/**
 * 用户当前可用的权限：用户启用、角色启用、权限启用三者都满足，超级管理员为全部启用的权限
 *
 * 后端不做授权拦截，这里取到的权限码只用来决定前端展示什么、什么能点
 */
export function getAvailablePermissionsByUserId(userId: number): Promise<Permission[]> {
  return request.get({
    url: `/users/${userId}/available-permissions`,
  })
}

export type { UserForm }
