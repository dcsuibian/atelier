/**
 * useAuth - 按钮级权限判断
 *
 * 判断依据是权限码，不是角色：角色是库里的数据、名字随时可改，权限码写在后端的
 * permissions.yml 里、发布后不改名，只有它才适合写进前端代码。
 *
 * 权限码集中定义在 `@/constants/permission`，用 PERMISSIONS.XXX 引用，不要写裸字符串。
 *
 * ## 使用示例
 *
 * ```vue
 * <script setup lang="ts">
 * const { hasAuth } = useAuth()
 * </script>
 *
 * <template>
 *   <ElButton v-if="hasAuth(PERMISSIONS.USER_ADD)">新增</ElButton>
 *   <!-- 也支持表达式 -->
 *   <ElButton v-if="hasAuth([PERMISSIONS.USER_EDIT, 'OR', PERMISSIONS.USER_DELETE])">操作</ElButton>
 * </template>
 * ```
 *
 * @module useAuth
 */

import type { PermissionExpression } from '@/types'
import { usePermissionStore } from '@/stores/permission'

export const useAuth = () => {
  const permissionStore = usePermissionStore()

  const hasAuth = (expression: PermissionExpression): boolean => permissionStore.check(expression)

  return {
    hasAuth,
  }
}
