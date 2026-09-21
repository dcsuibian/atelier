<!-- 角色管理页面 -->
<template>
  <div class="art-full-height">
    <RoleSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    ></RoleSearch>

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="hasAuth(PERMISSIONS.ROLE_ADD)" @click="showDialog()" v-ripple>新增角色</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <RoleEditDialog v-model:visible="dialogVisible" :role="currentRole" @submit="handleDialogSubmit" />

    <RolePermissionDialog v-model:visible="permissionDialogVisible" :role="currentRole" />
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@vueuse/core'
import { ElMessageBox, ElTag } from 'element-plus'
import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
import { useTable } from '@/hooks/core/useTable'
import { useAuth } from '@/hooks/core/useAuth'
import { deleteRoleById, getRoles } from '@/apis/role'
import { PERMISSIONS } from '@/constants/permission'
import type { Role, RoleQuery, RoleStatus } from '@/types'
import RoleSearch from './modules/role-search.vue'
import RoleEditDialog from './modules/role-edit-dialog.vue'
import RolePermissionDialog from './modules/role-permission-dialog.vue'

defineOptions({ name: 'Role' })

const { hasAuth } = useAuth()

const STATUS_TAG: Record<RoleStatus, { type: 'success' | 'danger'; text: string }> = {
  ENABLED: { type: 'success', text: '启用' },
  DISABLED: { type: 'danger', text: '禁用' },
}

const searchForm = ref<RoleQuery>({
  searchText: undefined,
  status: undefined,
})

const showSearchBar = ref(false)

const {
  columns,
  columnChecks,
  data,
  loading,
  pagination,
  getData,
  searchParams,
  resetSearchParams,
  handleSizeChange,
  handleCurrentChange,
  refreshData,
  refreshCreate,
  refreshUpdate,
  refreshRemove,
} = useTable({
  core: {
    apiFn: getRoles,
    apiParams: {
      pageNumber: 1,
      pageSize: 20,
      ...searchForm.value,
    },
    columnsFactory: () => [
      { type: 'index', width: 60, label: '序号' },
      { prop: 'name', label: '角色名称', minWidth: 120 },
      { prop: 'description', label: '角色描述', minWidth: 150, showOverflowTooltip: true },
      {
        prop: 'status',
        label: '角色状态',
        width: 100,
        formatter: row => h(ElTag, { type: STATUS_TAG[row.status].type }, () => STATUS_TAG[row.status].text),
      },
      {
        prop: 'createTime',
        label: '创建时间',
        width: 180,
        formatter: row => formatDate(new Date(row.createTime), 'YYYY-MM-DD HH:mm:ss'),
      },
      {
        prop: 'operation',
        label: '操作',
        width: 80,
        fixed: 'right',
        formatter: row =>
          h('div', [
            h(ArtButtonMore, {
              list: [
                {
                  key: 'permission',
                  label: '分配权限',
                  icon: 'ri:shield-keyhole-line',
                  auth: PERMISSIONS.ROLE_ASSIGN_PERMISSION,
                },
                {
                  key: 'edit',
                  label: '编辑角色',
                  icon: 'ri:edit-2-line',
                  auth: PERMISSIONS.ROLE_EDIT,
                },
                {
                  key: 'delete',
                  label: '删除角色',
                  icon: 'ri:delete-bin-4-line',
                  color: '#f56c6c',
                  auth: PERMISSIONS.ROLE_DELETE,
                },
              ],
              onClick: (item: ButtonMoreItem) => buttonMoreClick(item, row),
            }),
          ]),
      },
    ],
  },
})

const handleSearch = () => {
  Object.assign(searchParams, searchForm.value)
  getData()
}

const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
/** 为 undefined 时是新增 */
const currentRole = ref<Role>()

const showDialog = (role?: Role) => {
  currentRole.value = role
  dialogVisible.value = true
}

const handleDialogSubmit = () => {
  if (currentRole.value) {
    refreshUpdate()
  } else {
    refreshCreate()
  }
}

const showPermissionDialog = (role: Role) => {
  currentRole.value = role
  permissionDialogVisible.value = true
}

const buttonMoreClick = (item: ButtonMoreItem, row: Role) => {
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
    await ElMessageBox.confirm(`确定删除角色「${role.name}」吗？其权限分配会一并删除。`, '删除角色', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  // 仍分配给用户时后端返回 409，提示由 http 层弹出
  await deleteRoleById(role.id)
  ElMessage.success('删除成功')
  refreshRemove()
}
</script>
