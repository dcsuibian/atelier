import type { Permission } from '@/types'
import request from '@/utils/http'

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
