<template>
  <div class="art-card p-5 flex-b mb-5 max-sm:mb-4">
    <div>
      <h2 class="text-2xl font-medium">关于项目</h2>
      <p class="text-g-700 mt-1">{{ systemName }} 是一款兼具设计美学与高效开发的后台系统</p>
      <p class="text-g-700 mt-1">使用了 Vue3、TypeScript、Vite、Element Plus 等前沿技术</p>
    </div>
    <img class="w-75 max-md:!hidden" src="@/assets/images/draw/draw1.png" alt="draw1" />
  </div>
</template>

<script setup lang="ts">
import AppConfig from '@/config'

const systemName = AppConfig.systemInfo.name
</script>
