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

/**
 * 权限表达式：一个权限码，或者两个表达式的 AND / OR 组合，可以嵌套
 *
 * 刻意只支持这两个运算符。NOT 之类的不要加——「没有某权限才能看见」这种规则一旦出现，
 * 权限就不再是单调递增的，加权限反而可能让人少看见东西，排查起来极难
 */
type PermissionExpression = string | [PermissionExpression, 'AND' | 'OR', PermissionExpression]

export type { Permission, PermissionStatus, PermissionExpression }
