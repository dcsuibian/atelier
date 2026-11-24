<!-- 柱状图卡片 -->
<template>
  <div class="art-card relative overflow-hidden" :style="{ height: `${height}rem` }">
    <div class="mb-5 flex-b items-start px-5 pt-5">
      <div>
        <p class="m-0 text-2xl font-medium leading-tight text-g-900">
          {{ value }}
        </p>
        <p class="mt-1 text-sm text-g-600">{{ label }}</p>
      </div>
      <div
        class="text-sm font-medium text-danger"
        :class="[percentage > 0 ? 'text-success' : '', isMiniChart ? 'absolute bottom-5' : '']"
      >
        {{ percentage > 0 ? '+' : '' }}{{ percentage }}%
      </div>
      <div v-if="date" class="absolute bottom-5 right-5 text-xs text-g-600">
        {{ date }}
      </div>
    </div>
    <!-- 定位交给外层（卡片里是 absolute），relative 放在内层 -->
    <div
      class="absolute bottom-0 left-0 right-0 mx-auto"
      :class="isMiniChart ? '!absolute !top-5 !right-5 !bottom-auto !left-auto !h-15 !w-4/10' : ''"
      :style="{ height: isMiniChart ? '60px' : `calc(${height}rem - 5rem)` }"
    >
      <div class="relative size-full">
        <div v-if="isEmpty" class="absolute inset-0 flex-cc text-xs" :style="{ color: isDark ? '#555555' : '#B3B2B2' }">
          {{ $t('common.noData') }}
        </div>
        <!-- autoresize 用 ResizeObserver 盯着容器，窗口缩放、菜单收起都会跟着重排 -->
        <VChart v-else :option="option" autoresize />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChartOps, useChart } from '@/composables/art/use-chart'
import type { EChartsOption } from 'echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'

use([CanvasRenderer, BarChart, GridComponent])

defineOptions({ name: 'ArtBarChartCard' })

interface Props {
  /** 数值 */
  value: number
  /** 标签 */
  label: string
  /** 百分比 +（绿色）-（红色） */
  percentage: number
  /** 日期 */
  date?: string
  /** 高度 */
  height?: number
  /** 颜色 */
  color?: string
  /** 图表数据 */
  chartData: number[]
  /** 柱状图宽度 */
  barWidth?: string
  /** 是否为迷你图表 */
  isMiniChart?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: 11,
  barWidth: '26%',
})

// 使用新的图表组件抽象
const { option, isEmpty, isDark } = useChart({
  checkEmpty: () => !props.chartData?.length || props.chartData.every(val => val === 0),
  generateOptions: (): EChartsOption => {
    const computedColor = props.color || useChartOps().themeColor

    return {
      grid: {
        top: 0,
        right: 0,
        bottom: 15,
        left: 0,
      },
      xAxis: {
        type: 'category',
        show: false,
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          data: props.chartData,
          type: 'bar',
          barWidth: props.barWidth,
          itemStyle: {
            color: computedColor,
            borderRadius: 2,
          },
        },
      ],
    }
  },
})
</script>
