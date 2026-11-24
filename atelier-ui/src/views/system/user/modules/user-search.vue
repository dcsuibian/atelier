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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserQuery } from '@/types'
import ArtSearchBar from '@/components/art/forms/art-search-bar/index.vue'

interface Emits {
  (e: 'search'): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

const formData = defineModel<UserQuery>({ required: true })

const { t } = useI18n()

// 写成 computed，切换语言时标签跟着变
const formItems = computed(() => [
  {
    label: t('common.keyword'),
    key: 'searchText',
    type: 'input',
    placeholder: t('system.user.searchPlaceholder'),
    clearable: true,
  },
  {
    label: t('common.status'),
    key: 'status',
    type: 'select',
    props: {
      placeholder: t('common.all'),
      clearable: true,
      options: [
        { label: t('common.enabled'), value: 'ENABLED' },
        { label: t('common.disabled'), value: 'DISABLED' },
      ],
    },
  },
])
</script>
