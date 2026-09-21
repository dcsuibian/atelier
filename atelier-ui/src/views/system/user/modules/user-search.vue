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
import type { UserQuery } from '@/types'

interface Emits {
  (e: 'search'): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

const formData = defineModel<UserQuery>({ required: true })

const formItems = [
  {
    label: '关键字',
    key: 'searchText',
    type: 'input',
    placeholder: '用户名 / 真实姓名 / 手机号',
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
