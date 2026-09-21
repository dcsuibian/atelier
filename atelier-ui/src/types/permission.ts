/**
 * 权限点。由后端的 permissions.yml 定义、启动时同步进库，接口只读
 *
 * code 是前端唯一该依赖的东西（`user:view` 这类），发布后不会改名；
 * 不再需要的权限会被置为 DISABLED，而不是删掉
 */
interface Permission {
  id: number
  code: string
  name: string
  description: string
  status: PermissionStatus
  createTime: number
  updateTime: number
}

type PermissionStatus = 'ENABLED' | 'DISABLED'

export type { Permission, PermissionStatus }
