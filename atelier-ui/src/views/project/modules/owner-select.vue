<!-- 负责人选择：按用户名、姓名远程搜索用户 -->
<template>
  <ElSelect
    v-model="ownerId"
    filterable
    remote
    :remote-method="search"
    :loading="loading"
    :placeholder="placeholder ?? $t('project.selectOwner')"
    clearable
  >
    <ElOption v-for="user in options" :key="user.id" :label="user.realName" :value="user.id">
      <span>{{ user.realName }}</span>
      <span class="ml-2 text-g-500">{{ user.name }}</span>
    </ElOption>
  </ElSelect>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElOption, ElSelect } from 'element-plus'
import { getUsers } from '@/apis/user'
import type { ProjectOwner } from '@/types'

interface Props {
  /** 已选中的负责人。远程搜索的选项一开始是空的，靠它显示出当前的名字 */
  owner?: ProjectOwner
  placeholder?: string
}

const props = defineProps<Props>()

const ownerId = defineModel<number>()

const options = ref<ProjectOwner[]>([])
const loading = ref(false)

watch(
  () => props.owner,
  owner => {
    options.value = owner ? [owner] : []
  },
  { immediate: true },
)

const search = async (searchText?: string) => {
  loading.value = true
  try {
    // 只取第一页：人多时靠搜索缩小范围，不在下拉里翻页
    const page = await getUsers({ searchText: searchText || undefined, pageNumber: 1, pageSize: 20 })
    options.value = page.data
  } finally {
    loading.value = false
  }
}
</script>
