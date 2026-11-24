<!-- 用户管理页面 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<template>
  <div class="art-full-height">
    <UserSearch v-model="searchForm" @search="handleSearch" @reset="handleSearch"></UserSearch>

    <ElCard class="art-table-card">
      <div class="flex h-full flex-col">
        <div v-if="permissionStore.check(PERMISSIONS.USER_ADD)" class="mb-3">
          <ElButton @click="showDialog()" v-ripple>{{ $t('system.user.add') }}</ElButton>
        </div>

        <div class="min-h-0 flex-1">
          <ElTable v-loading="loading" :data="users" height="100%">
            <ElTableColumn type="index" :label="$t('common.index')" width="60" />
            <ElTableColumn :label="$t('system.user.name')" min-width="240">
              <template #default="{ row }">
                <div class="flex-c">
                  <!-- 预览插入到 body 上，否则在表格内部样式会错乱 -->
                  <ElImage
                    class="size-9.5 rounded-md"
                    :src="row.avatar ?? defaultAvatar"
                    :preview-src-list="[row.avatar ?? defaultAvatar]"
                    preview-teleported
                  />
                  <div class="ml-2">
                    <p>{{ row.name }}</p>
                    <p>{{ row.email ?? '' }}</p>
                  </div>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="realName" :label="$t('system.user.realName')" />
            <ElTableColumn :label="$t('system.user.gender')">
              <template #default="{ row }">{{ row.gender && $t(`system.user.genders.${row.gender}`) }}</template>
            </ElTableColumn>
            <ElTableColumn :label="$t('system.user.phoneNumber')">
              <template #default="{ row }">{{ row.phoneNumber ?? '-' }}</template>
            </ElTableColumn>
            <ElTableColumn :label="$t('common.status')">
              <template #default="{ row }">
                <ElTag :type="STATUS_TAG[row.status as UserStatus].type">
                  {{ STATUS_TAG[row.status as UserStatus].text }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="$t('common.createTime')" width="180">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </ElTableColumn>
            <ElTableColumn :label="$t('common.operation')" width="120" fixed="right">
              <template #default="{ row }">
                <!-- 编辑弹窗里既改资料也分配角色，有其一就给入口 -->
                <ArtButtonTable
                  v-if="permissionStore.check({ or: [PERMISSIONS.USER_EDIT, PERMISSIONS.USER_ASSIGN_ROLE] })"
                  type="edit"
                  @click="showDialog(row as User)"
                />
                <ArtButtonTable
                  v-if="permissionStore.check(PERMISSIONS.USER_DELETE) && SUPER_ADMIN_ID !== row.id"
                  type="delete"
                  @click="deleteUser(row as User)"
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

      <UserDialog v-model:visible="dialogVisible" :user="currentUser" @submit="handleDialogSubmit" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  ElButton,
  ElCard,
  ElImage,
  ElMessage,
  ElMessageBox,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
  vLoading,
} from 'element-plus'
import { useI18n } from 'vue-i18n'
import ArtButtonTable from '@/components/art/forms/art-button-table/index.vue'
import { usePermissionStore } from '@/stores/permission'
import { deleteUserById, getUsers } from '@/apis/user'
import { formatDateTime } from '@/utils/format'
import { PERMISSIONS } from '@/constants/permission'
import { SUPER_ADMIN_ID } from '@/constants/user'
import type { User, UserQuery, UserStatus } from '@/types'
import defaultAvatar from '@/assets/images/user/avatar.webp'
import UserSearch from './modules/user-search.vue'
import UserDialog from './modules/user-dialog.vue'

defineOptions({ name: 'User' })

const permissionStore = usePermissionStore()
const { t } = useI18n()

const STATUS_TAG: Record<UserStatus, { type: 'success' | 'danger'; text: string }> = {
  ENABLED: { type: 'success', text: t('common.enabled') },
  DISABLED: { type: 'danger', text: t('common.disabled') },
}

const searchForm = ref<UserQuery>({
  searchText: undefined,
  status: undefined,
})
const pageNumber = ref(1)
const pageSize = ref(20)
const total = ref(0)
const users = ref<User[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const page = await getUsers({ ...searchForm.value, pageNumber: pageNumber.value, pageSize: pageSize.value })
    users.value = page.data
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
/** 为 undefined 时是新增 */
const currentUser = ref<User>()

const showDialog = (user?: User) => {
  currentUser.value = user
  dialogVisible.value = true
}

// 新增的记录排在哪一页说不准，回第一页；编辑留在当前页
const handleDialogSubmit = () => {
  if (!currentUser.value) {
    pageNumber.value = 1
  }
  load()
}

const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(t('system.user.deleteConfirm', { name: user.name }), t('system.user.delete'), {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  await deleteUserById(user.id)
  ElMessage.success(t('common.deleteSuccess'))
  // 删掉的是当前页最后一条时，当前页已经不存在了，退回上一页
  if (1 === users.value.length && pageNumber.value > 1) {
    pageNumber.value--
  }
  load()
}
</script>
