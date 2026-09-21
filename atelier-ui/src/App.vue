<template>
  <ElConfigProvider
    size="default"
    :locale="locales[language]"
    :z-index="3000"
    :card="{
      shadow: 'never',
    }"
  >
    <RouterView></RouterView>
  </ElConfigProvider>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import zh from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { systemUpgrade } from '@/utils/art/sys'
import { toggleTransition } from '@/utils/art/ui/animation'
import { checkStorageCompatibility } from '@/utils/art/storage'
import { initializeTheme } from './hooks/core/useTheme'

const userStore = useUserStore()
const { language } = storeToRefs(userStore)

const locales = {
  zh: zh,
  en: en,
}

onBeforeMount(() => {
  toggleTransition(true)
  initializeTheme()
})

onMounted(() => {
  checkStorageCompatibility()
  toggleTransition(false)
  systemUpgrade()
})
</script>
