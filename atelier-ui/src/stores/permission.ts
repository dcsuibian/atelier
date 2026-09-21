import type { Permission, PermissionExpression } from '@/types'

/**
 * 当前用户可用的权限码。只负责存放与判断，什么时候加载、什么时候清空由 session store 编排
 *
 * 后端不做授权拦截，这里的权限只决定前端展示什么、什么能点
 */
export const usePermissionStore = defineStore('permission', () => {
  const codes = ref<Set<string>>(new Set())

  function set(permissions: Permission[]) {
    codes.value = new Set(permissions.filter(p => 'ENABLED' === p.status).map(p => p.code))
  }

  function clear() {
    codes.value = new Set()
  }

  /**
   * 求值权限表达式。传 undefined / null 视为不设限，返回 true
   */
  function check(expression: PermissionExpression | undefined | null): boolean {
    if (undefined === expression || null === expression) {
      return true
    }
    if ('string' === typeof expression) {
      return codes.value.has(expression)
    }
    const [left, operator, right] = expression
    return 'AND' === operator ? check(left) && check(right) : check(left) || check(right)
  }

  return {
    codes,
    set,
    clear,
    check,
  }
})
