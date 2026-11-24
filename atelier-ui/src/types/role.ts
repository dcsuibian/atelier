/**
 * 角色。只是权限的集合，前端代码不认角色——角色名随时会被改，判断一律看权限码
 */
interface Role {
  id: number
  name: string
  description: string
  status: RoleStatus
  createTime: number
  updateTime: number
}

type RoleStatus = 'ENABLED' | 'DISABLED'

export type { Role, RoleStatus }
