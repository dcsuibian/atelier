<template>
  <ElDialog
    v-model="visible"
    :title="$t('system.role.assignPermissionTitle', { name: role?.name ?? '' })"
    width="520px"
    align-center
    class="el-dialog-border"
    @open="handleOpen"
  >
    <ElScrollbar v-loading="loading" height="60vh">
      <ElTree
        ref="treeRef"
        :data="treeData"
        show-checkbox
        node-key="key"
        default-expand-all
        :props="{ label: 'label', children: 'children' }"
        @check="handleTreeCheck"
      >
        <template #default="{ data }">
          <div class="flex-c gap-2">
            <span>{{ data.label }}</span>
            <code v-if="data.code" class="text-xs text-g-500">{{ data.code }}</code>
          </div>
        </template>
      </ElTree>
    </ElScrollbar>
    <template #footer>
      <ElButton @click="toggleExpandAll">{{
        isExpandAll ? $t('system.role.collapseAll') : $t('system.role.expandAll')
      }}</ElButton>
      <ElButton @click="toggleSelectAll">{{
        isSelectAll ? $t('system.role.deselectAll') : $t('system.role.selectAll')
      }}</ElButton>
      <ElButton type="primary" :loading="submitting" :disabled="loading" @click="savePermissions">{{
        $t('common.save')
      }}</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import type { TreeInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getPermissionsByRoleId, setPermissionsByRoleId } from '@/apis/role'
import { getAllPermissions } from '@/apis/permission'
import { getRolesByUserId } from '@/apis/user'
import { useSessionStore } from '@/stores/session'
import type { Permission, Role } from '@/types'

interface Props {
  role?: Role
}

const props = defineProps<Props>()

const visible = defineModel<boolean>('visible', { required: true })

/**
 * 分组节点的 key 是 `group:前缀`，权限节点的 key 是权限 id
 */
interface TreeNode {
  key: string | number
  label: string
  code?: string
  children?: TreeNode[]
}

const { t } = useI18n()

const treeRef = ref<TreeInstance>()
const treeData = ref<TreeNode[]>([])
const isExpandAll = ref(true)
const isSelectAll = ref(false)
const loading = ref(false)
const submitting = ref(false)

/**
 * 角色已分配、但权限本身已禁用的那些。树里不展示（禁用的权限不生效），
 * 但保存时要原样带回去，否则整体替换会把它们悄悄删掉，权限重新启用后角色就少了
 */
let disabledPermissionIds: number[] = []

/**
 * 按权限码冒号前的部分分组：`user:view`、`user:edit` 归到 `user` 下
 */
const buildTree = (permissions: Permission[]): TreeNode[] => {
  const groups = new Map<string, TreeNode[]>()
  for (const permission of permissions) {
    const prefix = permission.code.split(':')[0]
    const children = groups.get(prefix) ?? []
    children.push({ key: permission.id, label: permission.name, code: permission.code })
    groups.set(prefix, children)
  }
  return [...groups].map(([prefix, children]) => ({ key: `group:${prefix}`, label: prefix, children }))
}

const handleOpen = async () => {
  const role = props.role
  if (!role) {
    return
  }
  treeData.value = []
  isExpandAll.value = true
  loading.value = true
  try {
    const [permissions, assigned] = await Promise.all([
      getAllPermissions({ status: 'ENABLED' }),
      getPermissionsByRoleId(role.id),
    ])
    treeData.value = buildTree(permissions)
    disabledPermissionIds = assigned.filter(p => 'DISABLED' === p.status).map(p => p.id)
    await nextTick()
    treeRef.value?.setCheckedKeys(assigned.filter(p => 'ENABLED' === p.status).map(p => p.id))
    handleTreeCheck()
  } catch {
    // 失败提示已由 http 层弹出
    visible.value = false
  } finally {
    loading.value = false
  }
}

const getCheckedPermissionIds = (): number[] =>
  (treeRef.value?.getCheckedKeys(true) ?? []).filter((key): key is number => 'number' === typeof key)

/**
 * 当前用户拥有这个角色时，改动立即作用到自己身上，不必重新登录
 */
const refreshSessionIfAffected = async (role: Role) => {
  const sessionStore = useSessionStore()
  const currentUser = sessionStore.user
  if (!currentUser) {
    return
  }
  const roles = await getRolesByUserId(currentUser.id)
  if (roles.some(item => item.id === role.id)) {
    await sessionStore.refresh()
  }
}

const savePermissions = async () => {
  const role = props.role
  if (!role) {
    return
  }
  submitting.value = true
  try {
    await setPermissionsByRoleId(role.id, [...getCheckedPermissionIds(), ...disabledPermissionIds])
    ElMessage.success(t('system.role.permissionSaved'))
    visible.value = false
    await refreshSessionIfAffected(role)
  } catch {
    // 已提示
  } finally {
    submitting.value = false
  }
}

const toggleExpandAll = () => {
  const tree = treeRef.value
  if (!tree) return
  Object.values(tree.store.nodesMap).forEach(node => {
    node.expanded = !isExpandAll.value
  })
  isExpandAll.value = !isExpandAll.value
}

const getAllPermissionIds = (): number[] =>
  treeData.value.flatMap(group => group.children ?? []).map(node => node.key as number)

const toggleSelectAll = () => {
  const tree = treeRef.value
  if (!tree) return
  tree.setCheckedKeys(isSelectAll.value ? [] : getAllPermissionIds())
  isSelectAll.value = !isSelectAll.value
}

/**
 * 同步全选按钮的状态
 */
const handleTreeCheck = () => {
  const total = getAllPermissionIds().length
  isSelectAll.value = 0 < total && getCheckedPermissionIds().length === total
}
</script>
