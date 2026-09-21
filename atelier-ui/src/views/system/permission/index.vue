<!-- 权限管理页面 -->
<!-- 权限点由后端的 permissions.yml 定义、启动时同步进库，这里只读：没有新增、编辑、删除 -->
<template>
  <div class="permission-page art-full-height">
    <PermissionSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></PermissionSearch>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData"></ArtTableHeader>

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
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@vueuse/core'
import { ElTag } from 'element-plus'
import { useTable } from '@/hooks/core/useTable'
import { getPermissions } from '@/apis/permission'
import type { PermissionQuery, PermissionStatus } from '@/types'
import PermissionSearch from './modules/permission-search.vue'

defineOptions({ name: 'Permission' })

const STATUS_TAG: Record<PermissionStatus, { type: 'success' | 'info'; text: string }> = {
  ENABLED: { type: 'success', text: '启用' },
  // 禁用的权限是 permissions.yml 里删掉或停用的，不再生效，但保留记录
  DISABLED: { type: 'info', text: '禁用' },
}

const searchForm = ref<PermissionQuery>({
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
} = useTable({
  core: {
    apiFn: getPermissions,
    apiParams: {
      pageNumber: 1,
      pageSize: 20,
      ...searchForm.value,
    },
    columnsFactory: () => [
      { type: 'index', width: 60, label: '序号' },
      {
        prop: 'code',
        label: '权限码',
        minWidth: 200,
        formatter: row => h('code', row.code),
      },
      { prop: 'name', label: '名称', minWidth: 120 },
      { prop: 'description', label: '描述', minWidth: 240 },
      {
        prop: 'status',
        label: '状态',
        formatter: row => h(ElTag, { type: STATUS_TAG[row.status].type }, () => STATUS_TAG[row.status].text),
      },
      {
        prop: 'updateTime',
        label: '更新时间',
        width: 180,
        formatter: row => formatDate(new Date(row.updateTime), 'YYYY-MM-DD HH:mm:ss'),
      },
    ],
  },
})

const handleSearch = () => {
  Object.assign(searchParams, searchForm.value)
  getData()
}
</script>
