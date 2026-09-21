<template>
  <ArtSearchBar
    v-model="formData"
    :items="formItems"
    :show-expand="false"
    @reset="emit('reset')"
    @search="emit('search')"
  >
  </ArtSearchBar>
</template>

<script setup lang="ts">
import type { PermissionQuery } from '@/types'

interface Emits {
  (e: 'search'): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

const formData = defineModel<PermissionQuery>({ required: true })

const formItems = [
  {
    label: '关键字',
    key: 'searchText',
    type: 'input',
    placeholder: '权限码 / 名称 / 描述',
    clearable: true,
  },
  {
    label: '状态',
    key: 'status',
    type: 'select',
    props: {
      placeholder: '全部',
      clearable: true,
      options: [
        { label: '启用', value: 'ENABLED' },
        { label: '禁用', value: 'DISABLED' },
      ],
    },
  },
]
</script>
