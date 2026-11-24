<template>
  <div>
    <SectionTitle :title="$t('setting.color.title')" class="mt-10" />
    <div class="-mr-4">
      <div class="flex flex-wrap">
        <div
          v-for="color in configOptions.mainColors"
          :key="color"
          class="flex items-center justify-center size-[23px] mr-4 mb-2.5 cursor-pointer rounded-full transition-all duration-200 hover:opacity-85"
          :style="{ background: `${color} !important` }"
          @click="colorHandlers.selectColor(color)"
        >
          <ArtSvgIcon icon="ri:check-fill" class="text-base !text-white" v-show="color === systemThemeColor" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SectionTitle from './section-title.vue'
import { useSettingStore } from '@/stores/setting'
import { useSettingsConfig } from '../composables/use-settings-config'
import { useSettingsHandlers } from '../composables/use-settings-handlers'
import { storeToRefs } from 'pinia'
import ArtSvgIcon from '@/components/art/icons/art-svg-icon/index.vue'

const settingStore = useSettingStore()
const { systemThemeColor } = storeToRefs(settingStore)
const { configOptions } = useSettingsConfig()
const { colorHandlers } = useSettingsHandlers()
</script>
