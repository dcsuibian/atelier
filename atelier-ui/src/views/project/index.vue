<!-- 项目管理页面 -->
<template>
  <div class="art-full-height">
    <ProjectSearch v-model="searchForm" @search="handleSearch" @reset="handleSearch"></ProjectSearch>

    <ElCard class="art-table-card">
      <div class="flex h-full flex-col">
        <div v-if="permissionStore.check(PERMISSIONS.PROJECT_ADD)" class="mb-3">
          <ElButton @click="showDialog()" v-ripple>{{ $t('project.add') }}</ElButton>
        </div>

        <div class="min-h-0 flex-1">
          <ElTable v-loading="loading" :data="projects" height="100%">
            <ElTableColumn type="index" :label="$t('common.index')" width="60" />
            <ElTableColumn prop="name" :label="$t('project.name')" min-width="160" />
            <ElTableColumn :label="$t('project.owner')" width="140">
              <template #default="{ row }">{{ (row as Project).owner.realName }}</template>
            </ElTableColumn>
            <ElTableColumn prop="description" :label="$t('common.description')" min-width="200" show-overflow-tooltip />
            <ElTableColumn :label="$t('common.createTime')" width="180">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </ElTableColumn>
            <ElTableColumn :label="$t('common.operation')" width="80" fixed="right">
              <template #default="{ row }">
                <ArtButtonMore
                  :list="OPERATIONS"
                  @click="(item: ButtonMoreItem) => handleOperation(item, row as Project)"
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

    <ProjectEditDialog v-model:visible="dialogVisible" :project="currentProject" @submit="handleDialogSubmit" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElButton, ElCard, ElMessage, ElMessageBox, ElPagination, ElTable, ElTableColumn, vLoading } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { ButtonMoreItem } from '@/components/art/forms/art-button-more/index.vue'
import ArtButtonMore from '@/components/art/forms/art-button-more/index.vue'
import { usePermissionStore } from '@/stores/permission'
import { deleteProjectById, getProjects } from '@/apis/project'
import { formatDateTime } from '@/utils/format'
import { PERMISSIONS } from '@/constants/permission'
import type { Project, ProjectQuery } from '@/types'
import ProjectSearch from './modules/project-search.vue'
import ProjectEditDialog from './modules/project-edit-dialog.vue'

defineOptions({ name: 'Project' })

const permissionStore = usePermissionStore()
const { t } = useI18n()

const OPERATIONS: ButtonMoreItem[] = [
  {
    key: 'edit',
    label: t('project.edit'),
    icon: 'ri:edit-2-line',
    auth: PERMISSIONS.PROJECT_EDIT,
  },
  {
    key: 'delete',
    label: t('project.delete'),
    icon: 'ri:delete-bin-4-line',
    color: '#f56c6c',
    auth: PERMISSIONS.PROJECT_DELETE,
  },
]

const searchForm = ref<ProjectQuery>({
  searchText: undefined,
  ownerId: undefined,
})
const pageNumber = ref(1)
const pageSize = ref(20)
const total = ref(0)
const projects = ref<Project[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const page = await getProjects({ ...searchForm.value, pageNumber: pageNumber.value, pageSize: pageSize.value })
    projects.value = page.data
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
const currentProject = ref<Project>()

const showDialog = (project?: Project) => {
  currentProject.value = project
  dialogVisible.value = true
}

// 新增的记录排在哪一页说不准，回第一页；编辑留在当前页
const handleDialogSubmit = () => {
  if (!currentProject.value) {
    pageNumber.value = 1
  }
  load()
}

const handleOperation = (item: ButtonMoreItem, row: Project) => {
  switch (item.key) {
    case 'edit':
      showDialog(row)
      break
    case 'delete':
      deleteProject(row)
      break
  }
}

const deleteProject = async (project: Project) => {
  try {
    await ElMessageBox.confirm(t('project.deleteConfirm', { name: project.name }), t('project.delete'), {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  await deleteProjectById(project.id)
  ElMessage.success(t('common.deleteSuccess'))
  // 删掉的是当前页最后一条时，当前页已经不存在了，退回上一页
  if (1 === projects.value.length && pageNumber.value > 1) {
    pageNumber.value--
  }
  load()
}
</script>
