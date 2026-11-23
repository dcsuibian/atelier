<!-- 权限管理页面 -->
<!-- 权限点由后端的 permissions.yml 定义、启动时同步进库，这里只读：没有新增、编辑、删除 -->
<template>
  <div class="art-full-height">
    <PermissionSearch v-model="searchForm" @search="handleSearch" @reset="handleSearch"></PermissionSearch>

    <ElCard class="art-table-card">
      <div class="flex h-full flex-col">
        <div class="min-h-0 flex-1">
          <ElTable v-loading="loading" :data="permissions" height="100%">
            <ElTableColumn type="index" label="序号" width="60" />
            <ElTableColumn label="权限码" min-width="200">
              <template #default="{ row }">
                <code>{{ row.code }}</code>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="name" label="名称" min-width="120" />
            <ElTableColumn prop="description" label="描述" min-width="240" />
            <ElTableColumn label="状态">
              <template #default="{ row }">
                <ElTag :type="STATUS_TAG[row.status as PermissionStatus].type">
                  {{ STATUS_TAG[row.status as PermissionStatus].text }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="更新时间" width="180">
              <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
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
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@vueuse/core'
import { getPermissions } from '@/apis/permission'
import type { Permission, PermissionQuery, PermissionStatus } from '@/types'
import PermissionSearch from './modules/permission-search.vue'

defineOptions({ name: 'Permission' })

const STATUS_TAG: Record<PermissionStatus, { type: 'success' | 'info'; text: string }> = {
  ENABLED: { type: 'success', text: '启用' },
  // 禁用的权限是 permissions.yml 里删掉或停用的，不再生效，但保留记录
  DISABLED: { type: 'info', text: '禁用' },
}

const formatTime = (time: number) => formatDate(new Date(time), 'YYYY-MM-DD HH:mm:ss')

const searchForm = ref<PermissionQuery>({
  searchText: undefined,
  status: undefined,
})
const pageNumber = ref(1)
const pageSize = ref(20)
const total = ref(0)
const permissions = ref<Permission[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const page = await getPermissions({ ...searchForm.value, pageNumber: pageNumber.value, pageSize: pageSize.value })
    permissions.value = page.data
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
</script>
