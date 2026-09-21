/**
 * 权限码，与后端 permissions.yml 一一对应
 *
 * 路由与页面里一律引用这里的常量，不要写裸字符串——后端新增或停用权限时，
 * 靠这张表就能找全前端的引用点。权限码发布后不改名，不再需要时后端置为 DISABLED
 */
const PERMISSIONS = {
  USER_VIEW: 'user:view',
  USER_ADD: 'user:add',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLE: 'user:assign-role',
  ROLE_VIEW: 'role:view',
  ROLE_ADD: 'role:add',
  ROLE_EDIT: 'role:edit',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN_PERMISSION: 'role:assign-permission',
  PERMISSION_VIEW: 'permission:view',
} as const

export { PERMISSIONS }
