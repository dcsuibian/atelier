<!-- 散点图 -->
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
import { ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { vLoading } from 'element-plus'
import type { EChartsOption } from 'echarts'
import { getCssVar } from '@/utils/art/ui'
import { useChartOps, useChart } from '@/composables/art/use-chart'
import type { ScatterChartProps } from '../types'

use([CanvasRenderer, ScatterChart, GridComponent, TooltipComponent])

defineOptions({ name: 'ArtScatterChart' })

const props = withDefaults(defineProps<ScatterChartProps>(), {
  // 基础配置
  height: useChartOps().chartHeight,
  loading: false,
  isEmpty: false,
  colors: () => useChartOps().colors,

  // 数据配置
  data: () => [{ value: [0, 0] }, { value: [0, 0] }],
  symbolSize: 14,

  // 轴线显示配置
  showAxisLabel: true,
  showAxisLine: true,
  showSplitLine: true,

  // 交互配置
  showTooltip: true,
  showLegend: false,
  legendPosition: 'bottom',
})

// 使用新的图表组件抽象
const {
  option,
  isEmpty,
  isDark,
  getAxisLineStyle,
  getAxisLabelStyle,
  getAxisTickStyle,
  getSplitLineStyle,
  getAnimationConfig,
  getTooltipStyle,
} = useChart({
  props,
  checkEmpty: () => {
    return !props.data?.length || props.data.every(item => item.value.every(val => val === 0))
  },
  generateOptions: (): EChartsOption => {
    const computedColor = props.colors[0] || getCssVar('--el-color-primary')

    return {
      grid: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
        containLabel: true,
      },
      tooltip: props.showTooltip
        ? getTooltipStyle('item', {
            formatter: (params: { value: [number, number] }) => {
              const [x, y] = params.value
              return `X: ${x}<br/>Y: ${y}`
            },
          })
        : undefined,
      xAxis: {
        type: 'value',
        axisLabel: getAxisLabelStyle(props.showAxisLabel),
        axisLine: getAxisLineStyle(props.showAxisLine),
        axisTick: getAxisTickStyle(),
        splitLine: getSplitLineStyle(props.showSplitLine),
      },
      yAxis: {
        type: 'value',
        axisLabel: getAxisLabelStyle(props.showAxisLabel),
        axisLine: getAxisLineStyle(props.showAxisLine),
        axisTick: getAxisTickStyle(),
        splitLine: getSplitLineStyle(props.showSplitLine),
      },
      series: [
        {
          type: 'scatter',
          data: props.data,
          symbolSize: props.symbolSize,
          itemStyle: {
            color: computedColor,
            shadowBlur: 6,
            shadowColor: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            shadowOffsetY: 2,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: isDark.value ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            },
            scale: true,
          },
          ...getAnimationConfig(),
        },
      ],
    }
  },
})
</script>
