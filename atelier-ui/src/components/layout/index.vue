<!-- 布局容器 -->
<template>
  <div class="app-layout">
    <aside id="app-sidebar">
      <ArtSidebarMenu />
    </aside>

    <!-- 页面在这里滚动，不是 window。scrollToTop 按这个 id 找它，改名要同步 -->
    <main id="app-main">
      <div id="app-header">
        <ArtHeaderBar />
      </div>
      <div id="app-content">
        <ArtPageContent />
      </div>
    </main>

    <div id="app-global">
      <ArtGlobalComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
import ArtGlobalComponent from '@/components/art/layouts/art-global-component/index.vue'
import ArtPageContent from '@/components/art/layouts/art-page-content/index.vue'
import ArtHeaderBar from '@/components/art/layouts/art-header-bar/index.vue'
import ArtSidebarMenu from '@/components/art/layouts/art-menus/art-sidebar-menu/index.vue'
defineOptions({ name: 'Layout' })
</script>

<style lang="scss" scoped>
@use './style';
</style>
