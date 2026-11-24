<!-- 设置面板 -->
<template>
  <div class="layout-settings">
    <SettingDrawer v-model="showDrawer" @open="handleOpen" @close="handleClose">
      <!-- 头部关闭按钮 -->
      <SettingHeader @close="closeDrawer" />
      <!-- 主题风格 -->
      <ThemeSettings />
      <!-- 菜单布局 -->
      <MenuLayoutSettings />
      <!-- 菜单风格 -->
      <MenuStyleSettings />
      <!-- 系统主题色 -->
      <ColorSettings />
      <!-- 盒子样式 -->
      <BoxStyleSettings />
      <!-- 容器宽度 -->
      <ContainerSettings />
      <!-- 基础配置 -->
      <BasicSettings />
      <!-- 操作按钮 -->
      <SettingActions />
    </SettingDrawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useSettingsPanel } from './composables/use-settings-panel'

import SettingDrawer from './widget/setting-drawer.vue'
import SettingHeader from './widget/setting-header.vue'
import ThemeSettings from './widget/theme-settings.vue'
import MenuLayoutSettings from './widget/menu-layout-settings.vue'
import MenuStyleSettings from './widget/menu-style-settings.vue'
import ColorSettings from './widget/color-settings.vue'
import BoxStyleSettings from './widget/box-style-settings.vue'
import ContainerSettings from './widget/container-settings.vue'
import BasicSettings from './widget/basic-settings.vue'
import SettingActions from './widget/setting-actions.vue'

defineOptions({ name: 'ArtSettingsPanel' })

interface Props {
  /** 是否打开 */
  open?: boolean
}

const props = defineProps<Props>()

// 使用设置面板逻辑
const settingsPanel = useSettingsPanel()
const { showDrawer } = settingsPanel

// 获取各种处理器
const { handleOpen, handleClose, closeDrawer } = settingsPanel.useDrawerControl()
const { initializeSettings, cleanupSettings } = settingsPanel.useSettingsInitializer()

// 监听 props 变化
settingsPanel.usePropsWatcher(props)

onMounted(() => {
  initializeSettings()
})

onUnmounted(() => {
  cleanupSettings()
})
</script>

<style lang="scss">
@use './style';
</style>
