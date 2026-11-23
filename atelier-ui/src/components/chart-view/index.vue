<!-- 图表的渲染壳：尺寸自适应、加载态、空数据提示。配置由 useChart 生成 -->
<template>
  <!-- 定位交给使用方（卡片里是 absolute），所以 relative 放在内层 -->
  <div :style="height ? { height } : undefined" v-loading="loading">
    <div class="relative size-full">
      <div v-if="empty" class="absolute inset-0 flex-cc text-xs" :style="{ color: isDark ? '#555555' : '#B3B2B2' }">
        暂无数据
      </div>
      <!-- autoresize 用 ResizeObserver 盯着容器，窗口缩放、菜单收起都会跟着重排 -->
      <VChart v-else :option="option" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@/stores/setting'

// 渲染器所有图表共用，在这里注册一次；图表类型与组件由各图表自己按需注册
use([CanvasRenderer])

defineOptions({ name: 'ChartView' })

defineProps<{
  option: EChartsOption
  height?: string
  loading?: boolean
  empty?: boolean
}>()

const { isDark } = storeToRefs(useSettingStore())
</script>
