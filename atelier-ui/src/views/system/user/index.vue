<!-- 用户管理页面 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<template>
  <div class="user-page art-full-height">
    <UserSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></UserSearch>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="hasAuth(PERMISSIONS.USER_ADD)" @click="showDialog()" v-ripple>新增用户</ElButton>
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

      <UserDialog v-model:visible="dialogVisible" :user="currentUser" @submit="handleDialogSubmit" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@vueuse/core'
import { ElImage, ElMessageBox, ElTag } from 'element-plus'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import { useTable } from '@/hooks/core/useTable'
import { useAuth } from '@/hooks/core/useAuth'
import { deleteUserById, getUsers } from '@/apis/user'
import { PERMISSIONS } from '@/constants/permission'
import { SUPER_ADMIN_ID } from '@/constants/user'
import type { User, UserGender, UserQuery, UserStatus } from '@/types'
import defaultAvatar from '@/assets/images/user/avatar.webp'
import UserSearch from './modules/user-search.vue'
import UserDialog from './modules/user-dialog.vue'

defineOptions({ name: 'User' })

const { hasAuth } = useAuth()

const GENDER_TEXT: Record<UserGender, string> = {
  MALE: '男',
  FEMALE: '女',
  UNKNOWN: '未知',
}

const STATUS_TAG: Record<UserStatus, { type: 'success' | 'danger'; text: string }> = {
  ENABLED: { type: 'success', text: '启用' },
  DISABLED: { type: 'danger', text: '禁用' },
}

const searchForm = ref<UserQuery>({
  searchText: undefined,
  status: undefined,
})

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
    apiFn: getUsers,
    apiParams: {
      pageNumber: 1,
      pageSize: 20,
      ...searchForm.value,
    },
    columnsFactory: () => [
      { type: 'index', width: 60, label: '序号' },
      {
        prop: 'name',
        label: '用户名',
        minWidth: 240,
        formatter: row =>
          h('div', { class: 'user flex-c' }, [
            h(ElImage, {
              class: 'size-9.5 rounded-md',
              src: row.avatar ?? defaultAvatar,
              previewSrcList: [row.avatar ?? defaultAvatar],
              // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
              previewTeleported: true,
            }),
            h('div', { class: 'ml-2' }, [
              h('p', { class: 'user-name' }, row.name),
              h('p', { class: 'email' }, row.email ?? ''),
            ]),
          ]),
      },
      { prop: 'realName', label: '真实姓名' },
      { prop: 'gender', label: '性别', formatter: row => GENDER_TEXT[row.gender] },
      { prop: 'phoneNumber', label: '手机号', formatter: row => row.phoneNumber ?? '-' },
      {
        prop: 'status',
        label: '状态',
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
        width: 120,
        fixed: 'right',
        formatter: row =>
          h('div', [
            // 编辑弹窗里既改资料也分配角色，有其一就给入口
            hasAuth({ or: [PERMISSIONS.USER_EDIT, PERMISSIONS.USER_ASSIGN_ROLE] })
              ? h(ArtButtonTable, { type: 'edit', onClick: () => showDialog(row) })
              : null,
            hasAuth(PERMISSIONS.USER_DELETE) && SUPER_ADMIN_ID !== row.id
              ? h(ArtButtonTable, { type: 'delete', onClick: () => deleteUser(row) })
              : null,
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
/** 为 undefined 时是新增 */
const currentUser = ref<User>()

const showDialog = (user?: User) => {
  currentUser.value = user
  dialogVisible.value = true
}

const handleDialogSubmit = () => {
  if (currentUser.value) {
    refreshUpdate()
  } else {
    refreshCreate()
  }
}

const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户「${user.name}」吗？其角色分配会一并删除。`, '删除用户', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  await deleteUserById(user.id)
  ElMessage.success('删除成功')
  refreshRemove()
}
</script>
