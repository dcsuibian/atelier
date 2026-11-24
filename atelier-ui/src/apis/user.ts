import type { PageWrapper, Permission, Role, User, UserGender, UserStatus } from '@/types'
import request from '@/utils/http'

/**
 * 用户列表的查询条件，对应后端 UserQo
 */
interface UserQo {
  status?: UserStatus | null
  /** 模糊匹配用户名、真实姓名、手机号，不区分大小写 */
  searchText?: string | null
}

/**
 * 新增用户时提交的数据。password 只进不出，响应里的 User 没有这个字段
 */
interface UserAddDto {
  name: string
  password: string
  realName: string
  gender: UserGender
  phoneNumber?: string | null
  email?: string | null
  avatar?: string | null
  /** 不传默认启用 */
  status?: UserStatus
}

/**
 * 部分更新用户时提交的数据。字段为 undefined 表示不修改——所以可空字段一旦有值就清不回空
 */
type UserEditPartiallyDto = Partial<UserAddDto>

export function getUsers(query: UserQo, pageNumber: number, pageSize: number): Promise<PageWrapper<User>> {
  return request.get({
    url: '/users',
    params: { ...query, pageNumber, pageSize },
  })
}

export function getUserById(id: number): Promise<User> {
  return request.get({
    url: `/users/${id}`,
  })
}

export function addUser(data: UserAddDto): Promise<User> {
  return request.post({
    url: '/users',
    data,
  })
}

export function editUserPartially(id: number, data: UserEditPartiallyDto): Promise<User> {
  return request.patch({
    url: `/users/${id}`,
    data,
  })
}

/**
 * 删除不级联：用户仍有角色或仍负责项目时拒绝删除（409），要先解除。超级管理员不能删除
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

export type { UserQo, UserAddDto, UserEditPartiallyDto }
