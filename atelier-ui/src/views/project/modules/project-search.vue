<template>
  <ArtSearchBar
    v-model="formData"
    :items="formItems"
    :show-expand="false"
    @reset="emit('reset')"
    @search="emit('search')"
  >
    <template #ownerId>
      <OwnerSelect v-model="formData.ownerId" :placeholder="$t('common.all')" />
    </template>
  </ArtSearchBar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProjectQuery } from '@/types'
import ArtSearchBar from '@/components/art/forms/art-search-bar/index.vue'
import OwnerSelect from './owner-select.vue'

interface Emits {
  (e: 'search'): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

const formData = defineModel<ProjectQuery>({ required: true })

const { t } = useI18n()

// 写成 computed，切换语言时标签跟着变
const formItems = computed(() => [
  {
    label: t('common.keyword'),
    key: 'searchText',
    type: 'input',
    placeholder: t('project.searchPlaceholder'),
    clearable: true,
  },
  {
    // 负责人用远程搜索的下拉，经插槽换成自己的组件
    label: t('project.owner'),
    key: 'ownerId',
  },
])
</script>
