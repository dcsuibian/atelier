<!-- 雷达图 -->
<template>
  <!-- 定位交给外层（卡片里是 absolute），relative 放在内层 -->
  <div class="relative w-full" :style="props.height ? { height: props.height } : undefined" v-loading="props.loading">
    <div class="relative size-full">
      <div v-if="isEmpty" class="absolute inset-0 flex-cc text-xs" :style="{ color: isDark ? '#555555' : '#B3B2B2' }">
        {{ $t('common.noData') }}
      </div>
      <!-- autoresize 用 ResizeObserver 盯着容器，窗口缩放、菜单收起都会跟着重排 -->
      <VChart v-else :option="option" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { RadarComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { vLoading } from 'element-plus'
import type { EChartsOption } from 'echarts'
import { useChartOps, useChart } from '@/composables/art/use-chart'
import type { RadarChartProps } from '../types'

use([CanvasRenderer, RadarChart, RadarComponent, TooltipComponent])

defineOptions({ name: 'ArtRadarChart' })

const props = withDefaults(defineProps<RadarChartProps>(), {
  // 基础配置
  height: useChartOps().chartHeight,
  loading: false,
  isEmpty: false,
  colors: () => useChartOps().colors,

  // 数据配置
  indicator: () => [],
  data: () => [],

  // 交互配置
  showTooltip: true,
  showLegend: false,
  legendPosition: 'bottom',
})

// 使用新的图表组件抽象
const { option, isEmpty, isDark, getAnimationConfig, getTooltipStyle } = useChart({
  props,
  checkEmpty: () => {
    return !props.data?.length || props.data.every(item => item.value.every(val => val === 0))
  },
  generateOptions: (): EChartsOption => {
    return {
      tooltip: props.showTooltip ? getTooltipStyle('item') : undefined,
      radar: {
        indicator: props.indicator,
        center: ['50%', '50%'],
        radius: '70%',
        axisName: {
          color: isDark.value ? '#ccc' : '#666',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: isDark.value ? '#444' : '#e6e6e6',
          },
        },
        axisLine: {
          lineStyle: {
            color: isDark.value ? '#444' : '#e6e6e6',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: isDark.value
              ? ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)']
              : ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.05)'],
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: props.data.map((item, index) => ({
            name: item.name,
            value: item.value,
            symbolSize: 4,
            lineStyle: {
              width: 2,
              color: props.colors[index % props.colors.length],
            },
            itemStyle: {
              color: props.colors[index % props.colors.length],
            },
            areaStyle: {
              color: props.colors[index % props.colors.length],
              opacity: 0.1,
            },
            emphasis: {
              areaStyle: {
                opacity: 0.25,
              },
              lineStyle: {
                width: 3,
              },
            },
          })),
          ...getAnimationConfig(200, 1800),
        },
      ],
    }
  },
})
</script>
