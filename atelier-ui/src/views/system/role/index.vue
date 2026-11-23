<!-- 角色管理页面 -->
<template>
  <div class="art-full-height">
    <RoleSearch v-model="searchForm" @search="handleSearch" @reset="handleSearch"></RoleSearch>

    <ElCard class="art-table-card">
      <div class="flex h-full flex-col">
        <div v-if="permissionStore.check(PERMISSIONS.ROLE_ADD)" class="mb-3">
          <ElButton @click="showDialog()" v-ripple>{{ $t('system.role.add') }}</ElButton>
        </div>

        <div class="min-h-0 flex-1">
          <ElTable v-loading="loading" :data="roles" height="100%">
            <ElTableColumn type="index" :label="$t('common.index')" width="60" />
            <ElTableColumn prop="name" :label="$t('system.role.name')" min-width="120" />
            <ElTableColumn
              prop="description"
              :label="$t('system.role.description')"
              min-width="150"
              show-overflow-tooltip
            />
            <ElTableColumn :label="$t('system.role.status')" width="100">
              <template #default="{ row }">
                <ElTag :type="STATUS_TAG[row.status as RoleStatus].type">
                  {{ STATUS_TAG[row.status as RoleStatus].text }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="$t('common.createTime')" width="180">
              <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
            </ElTableColumn>
            <ElTableColumn :label="$t('common.operation')" width="80" fixed="right">
              <template #default="{ row }">
                <ArtButtonMore
                  :list="OPERATIONS"
                  @click="(item: ButtonMoreItem) => handleOperation(item, row as Role)"
                />
              </template>
            </ElTableColumn>
          </ElTable>
        </div>

        <ElPagination
          v-model:current-page="pageNumber"
          v-model:page-size="pageSize"
          class="mt-3 justify-end"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @change="load"
        />
      </div>
    </ElCard>

    <RoleEditDialog v-model:visible="dialogVisible" :role="currentRole" @submit="handleDialogSubmit" />

    <RolePermissionDialog v-model:visible="permissionDialogVisible" :role="currentRole" />
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@vueuse/core'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { ButtonMoreItem } from '@/components/art/forms/art-button-more/index.vue'
import ArtButtonMore from '@/components/art/forms/art-button-more/index.vue'
import { usePermissionStore } from '@/stores/permission'
import { deleteRoleById, getRoles } from '@/apis/role'
import { PERMISSIONS } from '@/constants/permission'
import type { Role, RoleQuery, RoleStatus } from '@/types'
import RoleSearch from './modules/role-search.vue'
import RoleEditDialog from './modules/role-edit-dialog.vue'
import RolePermissionDialog from './modules/role-permission-dialog.vue'

defineOptions({ name: 'Role' })

const permissionStore = usePermissionStore()
const { t } = useI18n()

const STATUS_TAG: Record<RoleStatus, { type: 'success' | 'danger'; text: string }> = {
  ENABLED: { type: 'success', text: t('common.enabled') },
  DISABLED: { type: 'danger', text: t('common.disabled') },
}

const OPERATIONS: ButtonMoreItem[] = [
  {
    key: 'permission',
    label: t('system.role.assignPermission'),
    icon: 'ri:shield-keyhole-line',
    auth: PERMISSIONS.ROLE_ASSIGN_PERMISSION,
  },
  {
    key: 'edit',
    label: t('system.role.edit'),
    icon: 'ri:edit-2-line',
    auth: PERMISSIONS.ROLE_EDIT,
  },
  {
    key: 'delete',
    label: t('system.role.delete'),
    icon: 'ri:delete-bin-4-line',
    color: '#f56c6c',
    auth: PERMISSIONS.ROLE_DELETE,
  },
]

const formatTime = (time: number) => formatDate(new Date(time), 'YYYY-MM-DD HH:mm:ss')

const searchForm = ref<RoleQuery>({
  searchText: undefined,
  status: undefined,
})
const pageNumber = ref(1)
const pageSize = ref(20)
const total = ref(0)
const roles = ref<Role[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const page = await getRoles({ ...searchForm.value, pageNumber: pageNumber.value, pageSize: pageSize.value })
    roles.value = page.data
    total.value = page.total
  } finally {
    loading.value = false
  }
}

// 重置时搜索栏已自行把表单恢复成初始值，同样回到第一页重新查
const handleSearch = () => {
  pageNumber.value = 1
  load()
}

onMounted(load)

const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
/** 为 undefined 时是新增 */
const currentRole = ref<Role>()

const showDialog = (role?: Role) => {
  currentRole.value = role
  dialogVisible.value = true
}

// 新增的记录排在哪一页说不准，回第一页；编辑留在当前页
const handleDialogSubmit = () => {
  if (!currentRole.value) {
    pageNumber.value = 1
  }
  load()
}

const showPermissionDialog = (role: Role) => {
  currentRole.value = role
  permissionDialogVisible.value = true
}

const handleOperation = (item: ButtonMoreItem, row: Role) => {
  switch (item.key) {
    case 'permission':
      showPermissionDialog(row)
      break
    case 'edit':
      showDialog(row)
      break
    case 'delete':
      deleteRole(row)
      break
  }
}

const deleteRole = async (role: Role) => {
  try {
    await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: role.name }), t('system.role.delete'), {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  // 仍分配给用户时后端返回 409，提示由 http 层弹出
  await deleteRoleById(role.id)
  ElMessage.success(t('common.deleteSuccess'))
  // 删掉的是当前页最后一条时，当前页已经不存在了，退回上一页
  if (1 === roles.value.length && pageNumber.value > 1) {
    pageNumber.value--
  }
  load()
}
</script>
