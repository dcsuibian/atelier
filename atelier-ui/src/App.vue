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
import { onBeforeMount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElConfigProvider } from 'element-plus'
import { useSettingStore } from '@/stores/setting'
import { LanguageEnum } from '@/constants/app'
import zh from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import 'dayjs/locale/zh-cn' // 与上面的语言包对应
import { toggleTransition } from '@/utils/art/ui/animation'
import { initializeTheme } from '@/composables/art/useTheme'

const settingStore = useSettingStore()
const { language } = storeToRefs(settingStore)

const locales = {
  [LanguageEnum.ZH_CN]: zh,
  [LanguageEnum.EN_US]: en,
}

onBeforeMount(() => {
  toggleTransition(true)
  initializeTheme()
})

onMounted(() => {
  toggleTransition(false)
})
</script>
