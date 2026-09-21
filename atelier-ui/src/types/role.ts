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

/**
 * 角色列表的查询条件，对应后端 RoleQo
 */
interface RoleQuery {
  status?: RoleStatus
  /** 模糊匹配角色名称、描述，不区分大小写 */
  searchText?: string
}

export type { Role, RoleStatus, RoleQuery }
