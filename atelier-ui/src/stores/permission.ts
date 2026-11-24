import { ref } from 'vue'
import { defineStore } from 'pinia'
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
   * 求值权限表达式
   *
   * 判断依据是权限码，不是角色：角色是库里的数据、名字随时可改，权限码写在后端的
   * permissions.yml 里、发布后不改名，只有它才适合写进前端代码。
   * 权限码用 `@/constants/permission` 的 PERMISSIONS.XXX 引用，不要写裸字符串。
   *
   * 按钮级判断直接在模板里调：`v-if="permissionStore.check(PERMISSIONS.USER_ADD)"`
   */
  function check(expression: PermissionExpression): boolean {
    if ('string' === typeof expression) {
      return codes.value.has(expression)
    }
    if ('and' in expression) {
      return expression.and.every(item => check(item))
    }
    if ('or' in expression) {
      return expression.or.some(item => check(item))
    }
    // 运算符都处理完了，这里只剩 never：以后加了运算符却忘了处理，类型检查会在这里报错。
    // 运行时万一走到这里（比如配置里写错了键），按没有权限处理，不抛异常拖垮路由注册
    const unknownExpression: never = expression
    console.error('[Permission] 无法识别的权限表达式', unknownExpression)
    return false
  }

  return {
    codes,
    set,
    clear,
    check,
  }
})
