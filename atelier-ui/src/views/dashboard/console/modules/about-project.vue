<template>
  <div class="art-card p-5 flex-b mb-5 max-sm:mb-4">
    <div>
      <h2 class="text-2xl font-medium">关于项目</h2>
      <p class="text-g-700 mt-1">{{ systemName }} 是一个前后端配套的后台管理系统模板</p>
      <p class="text-g-700 mt-1">前端用 Vue 3、TypeScript、Vite、Element Plus，后端用 Spring Boot、jOOQ、PostgreSQL</p>
    </div>
    <img class="w-75 max-md:!hidden" src="@/assets/images/draw/draw1.png" alt="draw1" />
  </div>
</template>

<script setup lang="ts">
import AppConfig from '@/config'

const systemName = AppConfig.systemInfo.name
</script>
